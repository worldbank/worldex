import json
import os
import sys
from typing import Dict, List

import h3
import h3pandas
import pandas as pd
import s3fs
from app.models import Dataset, H3Data
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, load_only
from sqlalchemy.orm.session import Session

from worldex.handlers.raster_handlers import RasterHandler

DATABASE_CONNECION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")

SKIP_LIST = [
    "cyclone-tracks-1969-2009",
    "global-droughts-events-1980-2001",
]


def create_dataset_from_metadata(
    metadata_file: s3fs.core.S3File, sess: Session
) -> (Dataset, bool):
    metadata = json.load(metadata_file)
    dataset_name = metadata["name"]
    dataset = sess.query(Dataset).filter(Dataset.name == dataset_name).options(load_only(Dataset.id, Dataset.has_compact_only)).first()
    if dataset:
        return dataset, True
    # TODO: actually create keyword objects
    keywords: list[str] = metadata.pop("keywords")
    metadata["uid"] = metadata.pop("id", "")
    return Dataset(**metadata), False


# TODO: templatize indexing scripts
def index_parent_of_compact_cells(
   dataset: Dataset, sess: Session
) -> None:
    dataset_id = dataset.id
    for res in range(8, 0, -1):
        insert_parents_query = text(
            """
            INSERT INTO h3_children_indicators (h3_index, dataset_id)
            WITH combined_indices AS (
                SELECT h3_index FROM h3_data WHERE dataset_id = :dataset_id AND h3_get_resolution(h3_index) = :res
                UNION
                SELECT h3_index FROM h3_children_indicators WHERE dataset_id = :dataset_id AND h3_get_resolution(h3_index) = :res
            )
            SELECT DISTINCT(h3_cell_to_parent(h3_index, :parent_res)), :dataset_id FROM combined_indices
            ON CONFLICT DO NOTHING;
            """
        ).bindparams(res=res, parent_res=res-1, dataset_id=dataset_id)
        sess.execute(insert_parents_query)
    dataset.has_compact_only = False
    sess.flush()


def create_h3_indices(file: s3fs.core.S3File, dataset_id: int) -> List[H3Data]:
    indices = pd.read_parquet(file)["h3_index"]
    compacted_indices = list(h3.compact(indices))
    df_pop = pd.DataFrame({"h3_index": compacted_indices}).astype({"h3_index": str})
    return [
        H3Data(h3_index=row["h3_index"], dataset_id=dataset_id)
        for _, row in df_pop.iterrows()
    ]


def main():
    engine = create_engine(DATABASE_CONNECION)

    s3 = s3fs.S3FileSystem(
        key=os.getenv("AWS_ACCESS_KEY_ID"),
        secret=os.getenv("AWS_SECRET_ACCESS_KEY"),
        endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
    )

    Session = sessionmaker(bind=engine)
    with Session() as sess:
        dirs = s3.ls("s3:///worldex-temp-storage/indexes/hdx/")
        for dir in dirs:
            if dir.split("/")[-1] in SKIP_LIST:
                continue
            files = s3.ls(dir)
            is_h3_indexed = (
                f"{dir}/h3.parquet" in files and f"{dir}/metadata.json" in files
            )
            if not is_h3_indexed:
                continue
            print(f"Indexing {dir}")
            try:
                with s3.open(f"s3://{dir}/metadata.json") as f:
                    dataset, already_exists = create_dataset_from_metadata(f, sess)
                    if already_exists:
                        if (dataset.has_compact_only):
                            print('Indexing parents of compact cells')
                            index_parent_of_compact_cells(dataset, sess)
                            sess.commit()
                        else:
                            print(f'{dataset.name} already exists')
                        continue
                    sess.add(dataset)
                    sess.flush()
                with s3.open(f"s3://{dir}/h3.parquet") as f:
                    indices = create_h3_indices(f, dataset.id)
                    sess.bulk_save_objects(indices)
                    sess.flush()
                    index_parent_of_compact_cells(dataset, sess)
                sess.commit()
            except Exception as e:
                sess.rollback()
                raise e


if __name__ == "__main__":
    sys.exit(main())

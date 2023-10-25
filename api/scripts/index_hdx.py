import json
import os
import sys
from typing import Dict, List

import h3
import h3pandas
import pandas as pd
import s3fs
from app.models import Dataset, H3Data
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import exists

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
) -> Dataset:
    metadata = json.load(metadata_file)
    dataset_name = metadata["name"]
    dataset_exists = sess.query(exists().where(Dataset.name == dataset_name)).scalar()
    assert not dataset_exists, f"'{dataset_name}' dataset already exists"

    # TODO: actually create keyword objects
    keywords: list[str] = metadata.pop("keywords")
    # TODO: remove handling once parquet files are corrected
    if "data_foramt" in metadata:
        metadata["data_format"] = metadata.pop("data_foramt")
    return Dataset(**metadata)


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
        for dir in dirs[:600]:
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
                    try:
                        dataset_pop = create_dataset_from_metadata(f, sess)
                    except AssertionError as e:
                        print(e)
                        continue
                    sess.add(dataset_pop)
                    sess.flush()
                with s3.open(f"s3://{dir}/h3.parquet") as f:
                    indices = create_h3_indices(f, dataset_pop.id)
                    sess.bulk_save_objects(indices)
                    sess.flush()
                sess.commit()
            except Exception as e:
                sess.rollback()
                raise e


if __name__ == "__main__":
    sys.exit(main())

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
METADATA_UPDATE_FIELDS = [
    "date_start",
    "date_end",
    "url",
    "files",
    "accessibility",
    "description",
    "data_format",
    "projection",
    "properties",
    "bbox"
]

SKIP_LIST = []

def update_dataset_metadata(
    metadata_file: s3fs.core.S3File, sess: Session
) -> Dataset:
    metadata = json.load(metadata_file)
    dataset_name = metadata["name"]
    metadata_payload = {
        field: metadata[field] for field in METADATA_UPDATE_FIELDS
    }
    metadata_payload["uid"] = metadata["id"]
    dataset = sess.query(Dataset).filter(Dataset.name == dataset_name).update(metadata_payload)
    dataset = sess.query(Dataset).filter(Dataset.name == dataset_name).options(load_only(Dataset.id, Dataset.has_compact_only)).first()
    sess.commit()
    return dataset
    # TODO: actually create keyword objects
    # keywords: list[str] = metadata.pop("keywords")


def create_h3_indices(file: s3fs.core.S3File, dataset_id: int) -> List[H3Data]:
    indices = pd.read_parquet(file)["h3_index"]
    # indices = h3.compact(indices)
    indices = list(indices)
    df_pop = pd.DataFrame({"h3_index": indices}).astype({"h3_index": str})
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
        result = sess.execute(text("SELECT COUNT(*) FROM datasets WHERE source_org = 'WorldPop' AND (uid IS NOT NULL OR uid != '')"))
        to_update = result.one()[0]
        dirs = s3.ls("s3:///worldex-temp-storage/indexes/worldpop/")
        # best effort to skip existing datasets assuming ls order has not changed
        for idx, dir in enumerate(dirs):
            if idx > to_update:
                break
            if dir.split("/")[-1] in SKIP_LIST:
                continue
            files = s3.ls(dir)
            is_parquet = (
                f"{dir}/h3-compact.parquet" in files and f"{dir}/metadata.json" in files
            )
            if not is_parquet:
                continue
            print(f"Indexing {dir}")
            try:
                with s3.open(f"s3://{dir}/metadata.json") as f:
                    dataset = update_dataset_metadata(f, sess)
            except Exception as e:
                sess.rollback()
                raise e


if __name__ == "__main__":
    sys.exit(main())
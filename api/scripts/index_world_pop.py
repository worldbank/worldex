import os
import pandas as pd
import shapely
import hashlib
import s3fs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm.session import Session
from sqlalchemy.sql import exists
from app.models import Dataset, H3Data
import sys
from datetime import datetime
import pytz
import json
import h3
import h3pandas
import sqlalchemy
from worldex.handlers.raster_handlers import RasterHandler
from typing import Dict

DATABASE_CONNECION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")


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


def create_h3_indices(file: s3fs.core.S3File, dataset_id: int):
    tile_errors = 0
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
        dirs = s3.ls("s3:///worldex-temp-storage/indexes/worldpop/")
        for dir in dirs:
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

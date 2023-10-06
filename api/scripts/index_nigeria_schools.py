import os
import sys
from datetime import datetime
from typing import List

import h3
import pytz
import s3fs
import shapely.geometry
from app.models import Dataset, H3Data
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists

from worldex.handlers.vector_handlers import VectorHandler

DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")
DATASET_NAME = "Nigeria Schools"


def create_dataset(file: s3fs.core.S3File, handler: VectorHandler) -> Dataset:
    bbox = shapely.geometry.box(*handler.bbox, ccw=True)
    try:
        last_fetched = file._details["LastModified"]
    except:
        last_fetched = datetime.now(pytz.utc)
    return Dataset(
        name=DATASET_NAME,
        last_fetched=last_fetched,
        source_org="Humanitarian Data Exchange",
        data_format="shp",
        files=[
            "https://data.humdata.org/dataset/ec228c18-8edc-4f3c-94c9-a6b946af7229/resource/8dcb7188-16f2-447a-b006-1895e450bf11/download/nigeria_-_schools.zip'",
        ],
        description="Schools and educational institutions in Nigeria",
        bbox=bbox.wkt,
    )


def create_h3_indices(handler: VectorHandler, dataset_id: int) -> List[H3Data]:
    indices = list(h3.compact(handler.h3index()))
    return [H3Data(h3_index=idx, dataset_id=dataset_id) for idx in indices]


def main():
    engine = create_engine(DATABASE_CONNECTION)
    s3 = s3fs.S3FileSystem(
        key=os.getenv("AWS_ACCESS_KEY_ID"),
        secret=os.getenv("AWS_SECRET_ACCESS_KEY"),
        endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
    )

    Session = sessionmaker(bind=engine)
    with Session() as sess:
        if sess.query(exists().where(Dataset.name == DATASET_NAME)).scalar():
            print(f"{DATASET_NAME} dataset already exists")
            return
        with s3.open(
            f"s3://{BUCKET}/{DATASET_DIR}/nigeria-schools.zip"
        ) as schools_file:
            try:
                handler = VectorHandler.from_file(schools_file)
                dataset = create_dataset(schools_file, handler)
                sess.add(dataset)
                sess.flush()

                indices = create_h3_indices(handler, dataset.id)
                sess.bulk_save_objects(indices)
                sess.commit()
            except Exception as e:
                sess.rollback()
                raise e


if __name__ == "__main__":
    sys.exit(main())

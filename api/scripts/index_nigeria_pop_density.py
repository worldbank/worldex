import os
import sys
from datetime import datetime
from typing import List

import h3
import pandas as pd
import pytz
import s3fs
import shapely
from app.models import Dataset, H3Data
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists

from worldex.handlers.raster_handlers import RasterHandler

DATABASE_CONNECION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")
DATASET_NAME = "Nigeria Population Density"


def create_dataset(file: s3fs.core.S3File, handler: RasterHandler) -> Dataset:
    bbox = shapely.geometry.box(*tuple(handler.bbox), ccw=True)
    try:
        last_fetched = file._details["LastModified"]
    except:
        last_fetched = datetime.now(pytz.utc)
    return Dataset(
        name=DATASET_NAME,
        last_fetched=last_fetched,
        source_org="WorldPop",
        data_format="tif",
        files=[
            "https://data.worldpop.org/GIS/Population_Density/Global_2000_2020_1km/2020/NGA/nga_pd_2020_1km.tif",
        ],
        description="Population density data in Nigeria for the year 2020, with a spatial resolution of 1 kilometer",
        bbox=bbox.wkt,
    )


def create_h3_indices(handler: RasterHandler, dataset_id: int) -> List[H3Data]:
    indices = list(h3.compact(handler.h3index()))
    return [H3Data(h3_index=idx, dataset_id=dataset_id) for idx in indices]


def main():
    engine = create_engine(DATABASE_CONNECION)

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
            f"s3://{BUCKET}/{DATASET_DIR}/nigeria-population.tif"
        ) as population_file:
            try:
                handler = RasterHandler.from_file(population_file)
                dataset = create_dataset(population_file, handler)
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

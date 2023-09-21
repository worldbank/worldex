import os
import logging
import pandas as pd
import s3fs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Index
import sys
from datetime import datetime
import pytz
from worldex.handlers.raster_handlers import RasterHandler

DATABASE_CONNECION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")
DATASET_NAME = "Nigeria Population Density"


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
                last_fetched = population_file._details["LastModified"]
            except:
                last_fetched = datetime.now(pytz.utc)
            handler = RasterHandler.from_file(population_file)
            h3_indices = handler.h3index()
            dataset = Dataset(name=DATASET_NAME, last_fetched=last_fetched)
            sess.add(dataset)
            sess.commit()

            hdf = pd.DataFrame({"h3_index": h3_indices, "dataset_id": dataset.id})
            hdf.to_sql(
                "h3_data",
                engine,
                if_exists="append",
                index=False,
                dtype={"h3_index": H3Index},
            )
            print(f"{DATASET_NAME} dataset loaded")


if __name__ == "__main__":
    sys.exit(main())

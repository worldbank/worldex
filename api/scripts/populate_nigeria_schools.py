import os
import s3fs
import sys
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Index
from worldex.handlers.vector_handlers import VectorHandler

DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")
DATASET_NAME = "Nigeria Schools"


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
            handler = VectorHandler.from_file(schools_file)
            h3_indices = handler.h3index()
            dataset = Dataset(name=DATASET_NAME)
            sess.add(dataset)
            sess.commit()

            hdf = pd.DataFrame({"h3_index": h3_indices, "dataset_id": dataset.id})
            print(hdf)
            hdf.to_sql(
                "h3_data",
                engine,
                if_exists="append",
                index=False,
                dtype={"h3_index": H3Index},
            )
            print(f"{DATASET_NAME} dataset loaded")
        return


if __name__ == "__main__":
    sys.exit(main())

import os
import s3fs
import pyarrow.parquet as pq
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Index
import sys

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
        df = (
            pq.ParquetDataset(
                f"s3://{BUCKET}/{DATASET_DIR}/nigeria-population-density.parquet",
                filesystem=s3,
            )
            .read_pandas()
            .to_pandas()
        )
        dataset = Dataset(name=DATASET_NAME)
        sess.add(dataset)
        sess.commit()

        df["dataset_id"] = dataset.id
        df.to_sql(
            "h3_data",
            engine,
            if_exists="append",
            index=False,
            dtype={"h3_index": H3Index},
        )
        print(f"{DATASET_NAME} dataset loaded")


if __name__ == "__main__":
    sys.exit(main())

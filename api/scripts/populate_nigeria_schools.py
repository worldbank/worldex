#!python
import os
import s3fs
import pyarrow.parquet as pq
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

database_connection = os.getenv("DATABASE_URL_SYNC")
SCHOOLS_DATASET_NAME = "Nigeria Schools"
POP_DENSITY_DATASET_NAME = "Nigeria Population Density"


def main():
    engine = create_engine(database_connection)
    sys.path.append(".")
    from app.models import Dataset, H3Index

    s3 = s3fs.S3FileSystem(
        key=os.getenv("AWS_ACCESS_KEY_ID"),
        secret=os.getenv("AWS_SECRET_ACCESS_KEY"),
        endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
    )

    Session = sessionmaker(bind=engine)
    with Session() as sess:
        df_schools = (
            pq.ParquetDataset(
                "s3://worldex-temp-storage/datasets/nigeria-schools.parquet",
                filesystem=s3,
            )
            .read_pandas()
            .to_pandas()
        )
        dataset_schools = Dataset(name=SCHOOLS_DATASET_NAME)
        sess.add(dataset_schools)
        sess.commit()

        df_schools["dataset_id"] = dataset_schools.id
        df_schools.to_sql(
            "h3_data",
            engine,
            if_exists="append",
            index=False,
            dtype={"h3_index": H3Index},
        )


if __name__ == "__main__":
    sys.exit(main())

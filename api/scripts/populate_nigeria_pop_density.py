import os
import s3fs
import pyarrow.parquet as pq
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Index
import sys

database_connection = os.getenv("DATABASE_URL_SYNC")
DATASET_NAME = "Nigeria Population Density"


def main():
    engine = create_engine(database_connection)

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
                "s3://worldex-temp-storage/datasets/nigeria-population-density.parquet",
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


# def upgrade() -> None:
#     import pandas as pd

#     conn = op.get_bind()
#     Session = sessionmaker(bind=conn)

#     with Session() as sess:
#         df_schools = pd.read_parquet("/tmp/datasets/nigeria-schools.parquet")
#         dataset_schools = Dataset(name=SCHOOLS_DATASET_NAME)
#         sess.add(dataset_schools)
#         sess.commit()

#         df_schools["dataset_id"] = dataset_schools.id
#         df_schools.to_sql(
#             "h3_data",
#             conn,
#             if_exists="append",
#             index=False,
#             dtype={"h3_index": H3Index},
#         )

#         df_pop_density = pd.read_parquet("/tmp/datasets/nigeria-population-density.parquet")
#         dataset_pop_density = Dataset(name=POP_DENSITY_DATASET_NAME)
#         sess.add(dataset_pop_density)
#         sess.commit()

#         df_pop_density["dataset_id"] = dataset_pop_density.id
#         df_pop_density.to_sql(
#             "h3_data",
#             conn,
#             if_exists="append",
#             index=False,
#             dtype={"h3_index": H3Index},
#         )


# def downgrade() -> None:
#     conn = op.get_bind()
#     Session = sessionmaker(bind=conn)
#     with Session() as sess:
#         rows = (
#             sess.query(Dataset)
#             .filter(Dataset.name.in_([SCHOOLS_DATASET_NAME, POP_DENSITY_DATASET_NAME]))
#             .all()
#         )
#         for row in rows:
#             sess.delete(row)
#         sess.commit()


# df_pop_density = pd.read_parquet("/tmp/datasets/nigeria-population-density.parquet")
# dataset_pop_density = Dataset(name=POP_DENSITY_DATASET_NAME)
# sess.add(dataset_pop_density)
# sess.commit()

# df_pop_density["dataset_id"] = dataset_pop_density.id
# df_pop_density.to_sql(
#     "h3_data",
#     conn,
#     if_exists="append",
#     index=False,
#     dtype={"h3_index": H3Index},
# )

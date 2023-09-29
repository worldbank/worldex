import os
import pandas as pd
import shapely
import hashlib
import s3fs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Index
import sys
from datetime import datetime
import pytz
import json
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
        dirs = s3.ls("s3:///worldex-temp-storage/indexes/worldpop/")
        for dir in dirs:
            with s3.open(f"s3://{dir}/metadata.json") as f:
                metadata = json.load(f)
                dataset_name = metadata["name"]
                if sess.query(exists().where(Dataset.name == dataset_name)).scalar():
                    print(f"{dataset_name} dataset already exists")
                    continue
                print(f"Indexing {dir}")
                keywords: list[str] = metadata.pop("keywords")
                if "data_foramt" in metadata:
                    metadata["data_format"] = metadata.pop("data_foramt")
                dataset_pop = Dataset(**metadata)
                sess.add(dataset_pop)
                sess.commit()
            with s3.open(f"s3://{dir}/h3.parquet") as f:
                # file_hash = hashlib.md5()
                # while chunk := f.read(8192):
                #     file_hash.update(chunk)
                # print(dir, file_hash.hexdigest())
                df_pop = pd.read_parquet(f)
                df_pop["dataset_id"] = dataset_pop.id
                df_pop.to_sql(
                    "h3_data",
                    engine,
                    if_exists="append",
                    index=False,
                    dtype={"h3_index": H3Index}
                )


if __name__ == "__main__":
    sys.exit(main())
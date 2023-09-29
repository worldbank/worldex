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
import h3
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
        for dir in dirs[:50]:
            try:
                with s3.open(f"s3://{dir}/metadata.json") as f:
                    metadata = json.load(f)
                    dataset_name = metadata["name"]
                    if sess.query(exists().where(Dataset.name == dataset_name)).scalar():
                        print(f"'{dataset_name}' dataset already exists")
                        continue
                    print(f"Indexing {dir}")
                    keywords: list[str] = metadata.pop("keywords")
                    if "data_foramt" in metadata:
                        metadata["data_format"] = metadata.pop("data_foramt")
                    dataset_pop = Dataset(**metadata)
                    sess.add(dataset_pop)
                    sess.commit()
                with s3.open(f"s3://{dir}/h3.parquet") as f:
                    df_pop = pd.read_parquet(f)
                    df_pop["dataset_id"] = dataset_pop.id
                    print(df_pop.shape[0], end="...")
                    df_pop.to_sql(
                        "h3_data",
                        engine,
                        if_exists="append",
                        index=False,
                        dtype={"h3_index": H3Index}
                    )
                    while True:
                        df_pop['h3_index'] = df_pop['h3_index'].apply(h3.h3_to_parent)
                        df_pop = df_pop.drop_duplicates(subset=['h3_index'])
                        print(df_pop.shape[0], end="...")
                        df_pop.to_sql(
                            "h3_data",
                            engine,
                            if_exists="append",
                            index=False,
                            dtype={"h3_index": H3Index}
                        )
                        if h3.h3_get_resolution(df_pop['h3_index'].iloc[0]) == 0:
                            print("")
                            break
            except:
                sess.rollback()


if __name__ == "__main__":
    sys.exit(main())
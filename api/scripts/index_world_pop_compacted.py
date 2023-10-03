import os
import pandas as pd
import shapely
import hashlib
import s3fs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
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
            if "zaf" not in dir[:57]:
                continue
            try:
                with s3.open(f"s3://{dir}/metadata.json") as f:
                    metadata = json.load(f)
                    metadata['name'] += ' (compacted)'
                    dataset_name = metadata['name']
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
                    tile_errors = 0
                    df_pop = pd.read_parquet(f)
                    df_pop = pd.DataFrame(
                        {'h3_index': list(h3.compact(df_pop['h3_index']))}
                    ).astype({'h3_index': str})
                    for _, row in df_pop.iterrows():
                        try:
                            sess.add(H3Data(h3_index=row['h3_index'], dataset_id=dataset_pop.id))
                            sess.commit()
                        except sqlalchemy.exc.InternalError as e:
                            sess.rollback()
                            tile_errors += 1
                            continue
                    print("Tile errors:", tile_errors)
            except Exception as e:
                sess.delete(dataset_pop)
                sess.commit()
                raise e
            finally:
                sess.commit()

if __name__ == "__main__":
    sys.exit(main())
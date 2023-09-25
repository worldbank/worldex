import os
import s3fs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Index
import sys
import geopandas as gpd
import h3pandas  # necessary import for a dataframe to have an h3 attribute

DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")
DATASET_NAME = "Critical Habitat"
H3_RESOLUTION = 8
TABLE = "h3_data"


def main():
    engine = create_engine(DATABASE_CONNECTION)

    s3 = s3fs.S3FileSystem(
        key=os.getenv("AWS_ACCESS_KEY_ID"),
        secret=os.getenv("AWS_SECRET_ACCESS_KEY"),
        endpoint_url=os.getenv("AWS_ENDPOINT_URL"),
    )

    gdf = gpd.read_file(s3.open(f"s3://{BUCKET}/{DATASET_DIR}/crithab_all_layers.zip"))
    hdf = (
        gdf.get_coordinates()
        .rename(columns={"x": "lng", "y": "lat"})
        .h3.geo_to_h3(H3_RESOLUTION)
    )
    hdf.index.name = "h3_index"
    hdf.reset_index()

    Session = sessionmaker(bind=engine)
    with Session() as sess:
        if sess.query(exists().where(Dataset.name == DATASET_NAME)).scalar():
            print(f"{DATASET_NAME} dataset already exists")
            return
        dataset = Dataset(name=DATASET_NAME)
        sess.add(dataset)
        sess.commit()

        hdf_payload = gpd.GeoDataFrame(index=hdf.index.copy())
        hdf_payload = hdf_payload[~hdf_payload.index.duplicated(keep="first")]
        hdf_payload["dataset_id"] = dataset.id
        hdf_payload.to_sql(
            "h3_data", engine, if_exists="append", dtype={"h3_index": H3Index}
        )
        print(f"{DATASET_NAME} dataset loaded")


if __name__ == "__main__":
    sys.exit(main())
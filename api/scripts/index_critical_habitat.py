import os
import s3fs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Data
from datetime import datetime
import sys
import h3
import pytz
import geopandas as gpd
import h3pandas  # necessary import for a dataframe to have an h3 attribute
from worldex.handlers.vector_handlers import VectorHandler
import shapely
from typing import List

DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")
DATASET_NAME = "Critical Habitat"
TABLE = "h3_data"


def create_dataset(file: s3fs.core.S3File, gdf: gpd.GeoDataFrame) -> Dataset:
    try:
        last_fetched = file._details["LastModified"]
    except:
        last_fetched = datetime.now(pytz.utc)
    return Dataset(
        name=DATASET_NAME,
        last_fetched=last_fetched,
        source_org="Unknown",
        data_format="shp",
        description="Critical habitats",
        bbox=shapely.geometry.box(*gdf.total_bounds, ccw=True).wkt,
    )


def create_h3_indices(
    gdf: gpd.GeoDataFrame, dataset_id: int, res: int = 8
) -> List[H3Data]:
    # TODO: replace with handler code
    hdf = (
        gdf.get_coordinates().rename(columns={"x": "lng", "y": "lat"}).h3.geo_to_h3(res)
    )
    deduplicated = set(hdf.index)
    compacted = list(h3.compact(deduplicated))
    return [H3Data(h3_index=index, dataset_id=dataset_id) for index in compacted]


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
            f"s3://{BUCKET}/{DATASET_DIR}/crithab_all_layers.zip"
        ) as crithab_file:
            try:
                gdf = gpd.read_file(crithab_file)
                dataset = create_dataset(crithab_file, gdf)
                sess.add(dataset)
                sess.flush()

                indices = create_h3_indices(gdf, dataset.id)
                sess.bulk_save_objects(indices)
                sess.commit()
            except Exception as e:
                sess.rollback()
                raise e


if __name__ == "__main__":
    sys.exit(main())

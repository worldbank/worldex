import os
import s3fs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import exists
from app.models import Dataset, H3Index
from datetime import datetime
import sys
import pytz
import geopandas as gpd
import h3pandas  # necessary import for a dataframe to have an h3 attribute
from worldex.handlers.vector_handlers import VectorHandler
import shapely

DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
BUCKET = os.getenv("AWS_BUCKET")
DATASET_DIR = os.getenv("AWS_DATASET_DIRECTORY")
DATASET_NAME = "Critical Habitat"
TABLE = "h3_data"


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

        with s3.open(f"s3://{BUCKET}/{DATASET_DIR}/crithab_all_layers.zip") as crithab_file:
            try:
                last_fetched = crithab_file._details["LastModified"]
            except:
                last_fetched = datetime.now(pytz.utc)
                
            gdf = gpd.read_file(crithab_file)
            dataset = Dataset(
                name=DATASET_NAME,
                last_fetched=last_fetched,
                source_org="Unknown",
                data_format="shp",
                description="Critical habitats",
                bbox=shapely.geometry.box(*gdf.total_bounds, ccw=True).wkt,
            )
            sess.add(dataset)
            sess.commit()

            # TODO: replace with handler code
            try:
                for res in range(1, 9):
                    print(f"Indexing with res {res}")
                    hdf = (
                        gdf.get_coordinates()
                        .rename(columns={"x": "lng", "y": "lat"})
                        .h3.geo_to_h3(res)
                    )
                    hdf.index.name = "h3_index"
                    hdf.reset_index()
                    hdf_payload = gpd.GeoDataFrame(index=hdf.index.copy())
                    hdf_payload = hdf_payload[~hdf_payload.index.duplicated(keep="first")]
                    hdf_payload["dataset_id"] = dataset.id
                    hdf_payload.to_sql(
                        "h3_data", engine, if_exists="append", dtype={"h3_index": H3Index}
                    )
                print(f"{DATASET_NAME} dataset loaded")
            except:
                sess.rollback()


if __name__ == "__main__":
    sys.exit(main())

"""Populate with dummy h3 data

Revision ID: 40e3843b1262
Revises: 5fc1564bf2ad
Create Date: 2023-08-17 13:24:59.184555

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

from app.models import Dataset, H3Index


# revision identifiers, used by Alembic.
revision: str = 'ca8c3968d71d'
down_revision: Union[str, None] = 'be3aa22ec420'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

H3_RESOLUTION = 8
TABLE = "h3_data"
DATASET_NAME = "Critical Habitat (dummy)"

def upgrade() -> None:
    import geopandas as gpd
    import h3pandas  # necessary import for a dataframe to have an h3 attribute

    gdf = gpd.read_file("/data/datagov/crithab_all_layers.zip")
    hdf = gdf.get_coordinates().rename(columns={"x": "lng", "y": "lat"}).h3.geo_to_h3(H3_RESOLUTION)
    hdf.index.name = "h3_index"
    hdf.reset_index()

    conn = op.get_bind()
    Session = sessionmaker(bind=conn)

    with Session() as sess:
        dataset = Dataset(name=DATASET_NAME)
        sess.add(dataset)
        sess.commit()

        hdf_to_db = gpd.GeoDataFrame(index=hdf.index.copy())
        hdf_to_db = hdf_to_db[~hdf_to_db.index.duplicated(keep='first')]
        hdf_to_db["dataset_id"] = dataset.id
        print(hdf_to_db.head())
        hdf_to_db.to_sql("h3_data", conn, if_exists='append', dtype={'h3_index': H3Index})


def downgrade() -> None:
    conn = op.get_bind()
    Session = sessionmaker(bind=conn)

    with Session() as sess:
        rows = sess.query(Dataset).filter_by(name=DATASET_NAME).all()
        for row in rows:
            sess.delete(row)
        sess.commit()

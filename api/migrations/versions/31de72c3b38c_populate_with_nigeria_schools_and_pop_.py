"""populate with nigeria schools and pop density

Revision ID: 31de72c3b38c
Revises: 15089bd532b8
Create Date: 2023-08-31 10:33:57.394020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

from app.models import Dataset, H3Index

# revision identifiers, used by Alembic.
revision: str = "31de72c3b38c"
down_revision: Union[str, None] = "15089bd532b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SCHOOLS_DATASET_NAME = "Nigeria Schools"
POP_DENSITY_DATASET_NAME = "Nigeria Population Density"


def upgrade() -> None:
    import pandas as pd

    conn = op.get_bind()
    Session = sessionmaker(bind=conn)

    with Session() as sess:
        df_schools = pd.read_parquet("/tmp/nigeria-schools.parquet")
        dataset_schools = Dataset(name=SCHOOLS_DATASET_NAME)
        sess.add(dataset_schools)
        sess.commit()

        df_schools["dataset_id"] = dataset_schools.id
        df_schools.to_sql(
            "h3_data",
            conn,
            if_exists="append",
            index=False,
            dtype={"h3_index": H3Index},
        )

        df_pop_density = pd.read_parquet("/tmp/nigeria-population-density.parquet")
        dataset_pop_density = Dataset(name=POP_DENSITY_DATASET_NAME)
        sess.add(dataset_pop_density)
        sess.commit()

        df_pop_density["dataset_id"] = dataset_pop_density.id
        df_pop_density.to_sql(
            "h3_data",
            conn,
            if_exists="append",
            index=False,
            dtype={"h3_index": H3Index},
        )


def downgrade() -> None:
    conn = op.get_bind()
    Session = sessionmaker(bind=conn)
    with Session() as sess:
        rows = (
            sess.query(Dataset)
            .filter(Dataset.name.in_([SCHOOLS_DATASET_NAME, POP_DENSITY_DATASET_NAME]))
            .all()
        )
        for row in rows:
            sess.delete(row)
        sess.commit()

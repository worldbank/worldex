"""Create indices for getting h3 parent

Revision ID: 02b869b43dee
Revises: 31de72c3b38c
Create Date: 2023-09-05 08:56:57.749843

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "02b869b43dee"
down_revision: Union[str, None] = "31de72c3b38c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# for resolutions 5 to 7 we're already aggregating/counting datasets, thus not using h3_cell_to_parent
h3_resolutions = [1, 2, 3, 4]
index_name_prefix = "ix_h3_data_h3_index_parent"


def upgrade() -> None:
    op.drop_index(op.f("ix_h3_data_h3_index"), table_name="h3_data")
    for res in h3_resolutions:
        op.create_index(
            op.f(f"{index_name_prefix}_{res}"),
            "h3_data",
            [
                sa.text("h3_cell_to_parent(h3_index, :resolution)").bindparams(
                    resolution=res
                )
            ],
        )


def downgrade() -> None:
    op.create_index(op.f("ix_h3_data_h3_index"), "h3_data", ["h3_index"], unique=False)
    for res in h3_resolutions:
        op.drop_index(op.f(f"{index_name_prefix}_{res}"), table_name="h3_data")

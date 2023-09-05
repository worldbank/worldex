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

index_name_prefix = "ix_h3_data_h3_index_parent"
h3_resolutions = [1, 2, 3, 4]


def upgrade() -> None:
    for res in h3_resolutions:
        op.execute(
            f"CREATE INDEX {index_name_prefix}_{res} on h3_data (h3_cell_to_parent(h3_index, {res}));"
        )


def downgrade() -> None:
    for res in h3_resolutions:
        op.execute(f"DROP INDEX {index_name_prefix}_{res};")

"""Index on h3 as a point

Revision ID: 15089bd532b8
Revises: ca8c3968d71d
Create Date: 2023-08-30 14:25:22.935316

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "15089bd532b8"
down_revision: Union[str, None] = "ca8c3968d71d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

index_name = "ix_h3_data_h3_index_as_point"


def upgrade() -> None:
    op.execute(
        f"CREATE INDEX {index_name} ON h3_data USING GIST (h3_cell_to_geometry(h3_index));"
    )


def downgrade() -> None:
    op.execute(f"DROP INDEX {index_name};")

"""Create h3 aggregate views

Revision ID: 5cd5355da939
Revises: e126787e81fb
Create Date: 2023-10-16 16:27:39.663337

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5cd5355da939"
down_revision: Union[str, None] = "e126787e81fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    for resolution in range(1, 9):
        print(
            f"Creating materialized view to aggregate dataset count at h3 resolution {resolution}..."
        )
        view_name = f"h3_data_res{resolution}"
        query = sa.text(
            f"""
        CREATE MATERIALIZED VIEW IF NOT EXISTS {view_name} AS
        WITH uncompacted AS (
            SELECT h3_uncompact_cells(array_agg(h3_index), {resolution}) h3_index, dataset_id
            FROM h3_data WHERE h3_get_resolution(h3_index) < {resolution}
            GROUP BY dataset_id
        ),
        parents AS (
            SELECT h3_cell_to_parent(h3_index, {resolution}) h3_index, COUNT(DISTINCT(dataset_id)) count
            FROM h3_data
            WHERE h3_get_resolution(h3_index) >= {resolution}
            GROUP BY h3_cell_to_parent(h3_index, {resolution})
        ),
        combined AS (
            SELECT h3_index, COUNT(DISTINCT(dataset_id)) count
            FROM uncompacted
            GROUP BY h3_index
            UNION
            SELECT h3_index, count FROM parents
        )
        SELECT h3_index, SUM(count) dataset_count
        FROM combined
        GROUP BY h3_index
        """
        )
        conn.execute(query)
        op.create_index(
            f"ix_{view_name}_h3_index_as_point",
            view_name,
            [sa.text("h3_cell_to_geometry(h3_index)")],
            unique=False,
            postgresql_using="gist",
        )


def downgrade() -> None:
    conn = op.get_bind()
    for resolution in range(1, 9):
        view_name = f"h3_data_res{resolution}"
        op.drop_index(f"ix_{view_name}_h3_index_as_point")
        conn.execute(sa.text(f"DROP MATERIALIZED VIEW IF EXISTS {view_name};"))

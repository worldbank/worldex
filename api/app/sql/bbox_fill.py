FILL = """
SELECT h3_polygon_to_cells(ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326), :resolution) fill_index
"""

# h3_polygon_to_cells() with resolution 2 is prone to `pq: error code: 1`
# as a work around, we polygon-fill with resolution 3 tiles instead
# and get their distinct resolution 2 parents after
FILL_RES2 = """
WITH bbox AS (
  SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
),
res3 AS (
  SELECT h3_polygon_to_cells((SELECT bbox FROM bbox), 3) res3
)
SELECT DISTINCT fill_index FROM res3,
LATERAL h3_cell_to_parent(res3, :resolution) AS fill_index
WHERE ST_Contains((SELECT bbox FROM bbox), h3_cell_to_geometry(fill_index))
"""

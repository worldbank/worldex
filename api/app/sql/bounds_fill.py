_bounds_query = """
WITH bbox AS (
  SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
)
SELECT CASE
  WHEN CAST(:location AS TEXT) IS NOT NULL
  THEN ST_Intersection((SELECT bbox FROM bbox), ST_GeomFromGeojson(CAST(:location AS TEXT)))
  ELSE (SELECT bbox FROM bbox)
  END bounds
"""

FILL = f"""
WITH bounds AS ({_bounds_query})
SELECT h3_polygon_to_cells((SELECT bounds FROM bounds), :resolution) fill_index
"""

# h3_polygon_to_cells() with resolution 2 is prone to `pq: error code: 1`
# as a work around, we polygon-fill with resolution 3 tiles instead
# and get their distinct resolution 2 parents after
FILL_RES2 = f"""
WITH bounds AS ({_bounds_query}),
res3 AS (
  SELECT h3_polygon_to_cells((SELECT bounds FROM bounds), 3) res3
)
SELECT DISTINCT fill_index FROM res3,
LATERAL h3_cell_to_parent(res3, :resolution) AS fill_index
WHERE ST_Contains((SELECT bounds FROM bounds), h3_cell_to_geometry(fill_index))
"""

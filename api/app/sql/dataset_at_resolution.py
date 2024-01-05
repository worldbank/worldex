query = """
WITH bbox AS (
  SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
),
_fill AS (
  SELECT h3_polygon_to_cells((SELECT bbox FROM bbox), CASE WHEN :resolution = 2 THEN 3 ELSE :resolution END) fill_index
),
fill AS (
  SELECT DISTINCT CASE WHEN :resolution = 2 THEN h3_cell_to_parent(fill_index, 2) ELSE fill_index END fill_index FROM _fill
),
with_parents AS (
  SELECT fill_index, ARRAY[{}] parents FROM fill GROUP BY fill_index
)
SELECT fill_index FROM with_parents JOIN h3_data ON h3_index = ANY(parents) AND dataset_id = :dataset_id
UNION ALL
SELECT fill_index h3_index FROM fill
JOIN h3_children_indicators ON h3_children_indicators.h3_index = fill_index AND dataset_id = :dataset_id
"""
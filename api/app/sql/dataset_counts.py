# h3_polygon_to_cells() with resolution 2 is prone to `pq: error code: 1`
# as a work around, we polygon-fill with resolution 3 tiles instead
# and get their distinct resolution 2 parents after
query = """
WITH bbox AS (
  SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
),
_fill AS (
  SELECT h3_polygon_to_cells((SELECT bbox FROM bbox), CASE WHEN :resolution = 2 THEN 3 ELSE :resolution END) fill_index
),
fill AS (
  SELECT DISTINCT CASE WHEN :resolution = 2  THEN h3_cell_to_parent(fill_index, 2) ELSE fill_index END FROM _fill
),
with_parents AS (
  SELECT fill_index, ARRAY[{}] parents FROM fill GROUP BY fill_index
),
parent_datasets AS (
  SELECT fill_index, COUNT(dataset_id) dataset_count
  FROM with_parents JOIN h3_data ON h3_index = ANY(parents) GROUP BY fill_index
),
children_datasets AS (
  SELECT fill_index, COUNT(dataset_id) dataset_count
  FROM fill
  JOIN h3_children_indicators ON h3_index = fill_index
  GROUP BY fill_index
)
SELECT fill_index, (COALESCE(p.dataset_count, 0) + COALESCE(c.dataset_count, 0)) dataset_count FROM parent_datasets p
FULL JOIN children_datasets c USING (fill_index);
"""
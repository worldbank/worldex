_bounds_query = "SELECT ST_GeomFromGeoJSON(CAST(:location AS TEXT)) bounds"

# TODO: make this less redundant
LOCATION_FILL = f"""
WITH bounds AS (
    {_bounds_query}
)
SELECT h3_polygon_to_cells((SELECT bounds FROM bounds), :resolution) fill_index
"""

LOCATION_FILL_RES2 = f"""
WITH bounds AS ({_bounds_query}),
res3 AS (
    SELECT h3_polygon_to_cells((SELECT bounds FROM bounds), 3) res3
)
SELECT DISTINCT fill_index FROM res3,
LATERAL h3_cell_to_parent(res3, :resolution) AS fill_index
WHERE ST_Contains((SELECT bounds FROM bounds), h3_cell_to_geometry(fill_index))
"""

DATASETS_BY_LOCATION = """
WITH fill AS ({fill_query}),
with_parents AS (
  SELECT fill_index, ARRAY[{parents_array}] parents FROM fill GROUP BY fill_index
),
filtered_datasets AS (
  SELECT DISTINCT(dataset_id) id FROM h3_data JOIN with_parents ON h3_index = ANY(parents)
  UNION ALL
  SELECT DISTINCT(dataset_id) id FROM h3_children_indicators JOIN fill ON h3_index = fill_index
)
SELECT
  id,
  name,
  ST_AsEWKT(bbox) bbox,
  source_org,
  regexp_replace(description, '\n', '\n', 'g') description,
  files,
  url,
  accessibility,
  date_start,
  date_end
FROM datasets JOIN filtered_datasets USING (id);
"""

fill = """
SELECT h3_polygon_to_cells((SELECT bounds FROM bounds), :resolution) fill_index
"""

fill_res2 = """
res3 AS (
  SELECT h3_polygon_to_cells((SELECT bounds FROM bounds), 3) res3
)
SELECT DISTINCT fill_index FROM res3,
LATERAL h3_cell_to_parent(res3, :resolution) AS fill_index
WHERE ST_Contains((SELECT bounds FROM bounds), h3_cell_to_geometry(fill_index))
"""

indexed_dataset_count = """
WITH bounds AS (
  SELECT ST_GeomFromGeojson(CAST(:location AS TEXT)) bounds
),
fill AS ({fill_query}),
candidate_datasets AS ({candidate_datasets_query}),
with_parents AS (
  SELECT fill_index, ARRAY[{parents_array}] parents FROM fill GROUP BY fill_index
),
dataset_ids AS (
  SELECT DISTINCT(dataset_id) FROM with_parents
  JOIN h3_data ON (
    h3_index = ANY(parents)
    AND dataset_id IN (SELECT id FROM candidate_datasets)
  )
  UNION
  SELECT DISTINCT(dataset_id) FROM h3_children_indicators
  WHERE h3_index = ANY(SELECT fill_index FROM fill)
  AND dataset_id = ANY(SELECT id FROM candidate_datasets)
)
SELECT COUNT(*) FROM dataset_ids;
"""

def get_indexed_dataset_count_query(resolution: int, candidate_datasets_query: str, parents_array: str) -> str:
    return indexed_dataset_count.format(
        fill_query=fill_res2 if resolution == 2 else fill,
        candidate_datasets_query=candidate_datasets_query,
        parents_array=parents_array
    )

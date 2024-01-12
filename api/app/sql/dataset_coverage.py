from .bbox_fill import FILL, FILL_RES2

_query = """
WITH fill AS ({fill_query}),
with_parents AS (
  SELECT fill_index, ARRAY_AGG(h3_cell_to_parent(fill_index, resolution)) parents
  FROM fill,
  LATERAL generate_series(0, :resolution) AS resolution
  GROUP BY fill_index
)
SELECT fill_index FROM with_parents JOIN h3_data ON h3_index = ANY(parents) AND dataset_id = :dataset_id
UNION ALL
SELECT fill_index h3_index FROM fill
JOIN h3_children_indicators ON h3_children_indicators.h3_index = fill_index AND dataset_id = :dataset_id
"""

DATASET_COVERAGE = _query.format(fill_query=FILL)
DATASET_COVERAGE_RES2 = _query.format(fill_query=FILL_RES2)
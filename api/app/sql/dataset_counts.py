DATASET_COUNTS = """
WITH fill AS ({fill_query}),
with_parents AS (
  SELECT fill_index, ARRAY[{parents_array}] parents FROM fill GROUP BY fill_index
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

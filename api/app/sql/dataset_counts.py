# not a fan of increasingly complicated, chained string-formatted queries
# look into using async select()

DATASET_COUNTS = """
WITH fill AS ({fill_query}),
with_parents AS (
  SELECT fill_index, ARRAY[{parents_array}] parents FROM fill GROUP BY fill_index
),
_parent_datasets AS (
  SELECT fill_index, dataset_id FROM with_parents
  JOIN h3_data ON h3_index = ANY(parents)
),
parent_datasets AS (
  SELECT
    fill_index,
    ARRAY_REMOVE(ARRAY_CAT(ARRAY[p.dataset_id], ARRAY_AGG(d.id)), NULL) dataset_ids
  FROM _parent_datasets p
  LEFT JOIN datasets d ON p.dataset_id = d.dataset_id
  GROUP BY fill_index, p.dataset_id
),
p_agg AS (
  SELECT fill_index, SUM(ARRAY_LENGTH(dataset_ids, 1)) dataset_count
  FROM parent_datasets
  GROUP BY fill_index
),
_children_datasets AS (
  SELECT fill_index, dataset_id FROM fill
  JOIN h3_children_indicators c ON h3_index = fill_index
),
children_datasets AS (
  SELECT fill_index, ARRAY_REMOVE(ARRAY_CAT(ARRAY[c.dataset_id], ARRAY_AGG(d.id)), NULL) dataset_ids FROM _children_datasets c
  LEFT JOIN datasets d ON c.dataset_id = d.dataset_id
  GROUP BY fill_index, c.dataset_id
),
c_agg AS (
  SELECT fill_index, SUM(ARRAY_LENGTH(dataset_ids, 1)) dataset_count
  FROM children_datasets
  GROUP BY fill_index
)
SELECT * FROM (
  SELECT
    fill_index index,
    (COALESCE(p.dataset_count, 0) + COALESCE(c.dataset_count, 0)) dataset_count
  FROM p_agg p
  FULL JOIN c_agg c USING (fill_index)
) f WHERE dataset_count > 0;
"""

DATASET_COUNTS_FILTERED = """
WITH fill AS ({fill_query}),
with_parents AS (
  SELECT fill_index, ARRAY[{parents_array}] parents FROM fill GROUP BY fill_index
),
candidate_datasets AS ({candidate_datasets_query}),
_parent_datasets AS (
  SELECT fill_index,
  dataset_id
  FROM with_parents
  JOIN h3_data
  ON h3_index = ANY(parents)
),
parent_datasets AS (
  SELECT
    fill_index,
    CASE WHEN
      d1.id IN (SELECT id FROM candidate_datasets)
      THEN
      1 + COUNT(d2.id)
      ELSE
      COUNT(d2.id)
    END dataset_count
  FROM _parent_datasets
  JOIN datasets d1
  ON _parent_datasets.dataset_id = d1.id
  LEFT JOIN datasets d2
  ON d1.id = d2.dataset_id
  AND d2.id IN (SELECT id FROM candidate_datasets)
  GROUP BY fill_index, d1.id
),
_children_datasets AS (
  SELECT fill_index,
  dataset_id
  FROM fill
  JOIN h3_children_indicators
  ON h3_index = fill_index
),
children_datasets AS (
  SELECT
    fill_index,
    CASE WHEN
      d1.id IN (SELECT id FROM candidate_datasets)
      THEN
      1 + COUNT(d2.id)
      ELSE
      COUNT(d2.id)
    END dataset_count
  FROM _children_datasets
  JOIN datasets d1
  ON _children_datasets.dataset_id = d1.id
  LEFT JOIN datasets d2
  ON d1.id = d2.dataset_id
  AND d2.id IN (SELECT id FROM candidate_datasets)
  GROUP BY fill_index, d1.id
),
fubar AS (
SELECT fill_index index, (COALESCE(p.dataset_count, 0) + COALESCE(c.dataset_count, 0)) dataset_count FROM parent_datasets p
FULL JOIN children_datasets c USING (fill_index)
)
SELECT index, dataset_count FROM fubar WHERE dataset_count > 0;
"""

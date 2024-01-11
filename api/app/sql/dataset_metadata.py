query = """
WITH with_parents AS (
    SELECT :target target_index, h3_cell_to_parent(CAST(:target AS H3INDEX), generate_series(0, :resolution)) parent
),
parent_datasets AS (
    SELECT DISTINCT(dataset_id) dataset_id FROM h3_data
    WHERE h3_index = ANY(ARRAY(SELECT parent FROM with_parents))
),
children_datasets AS (
    SELECT DISTINCT(dataset_id) dataset_id FROM h3_children_indicators
    WHERE h3_index = CAST(:target AS H3INDEX)
),
dataset_ids AS (
    SELECT dataset_id FROM parent_datasets UNION
    SELECT dataset_id FROM children_datasets
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
FROM datasets
WHERE id = ANY(ARRAY(SELECT dataset_id FROM dataset_ids))
"""
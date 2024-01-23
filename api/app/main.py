import h3
import uvicorn
from app import settings
from app.db import get_async_session
from app.models import DatasetRequest, HealthCheck, H3TileRequest, DatasetsByLocationRequest
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shapely import wkt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.sql.bounds_fill import FILL, FILL_RES2
from app.sql.dataset_metadata import DATASET_METADATA
from app.sql.dataset_counts import DATASET_COUNTS
from app.sql.dataset_coverage import DATASET_COVERAGE

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
)

app.add_middleware(
    CORSMiddleware,
    # TODO: configure instead of hardcoding
    allow_origins=[
        "http://localhost:4173",
        "http://w1lxscirender01.worldbank.org:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health_check", response_model=HealthCheck)
async def health_check():
    return {
        "name": settings.project_name,
        "version": settings.version,
    }


@app.post("/h3_tile/{index}")
async def get_h3_tile_data(
    index: str,
    session: AsyncSession = Depends(get_async_session),
):
    resolution = h3.h3_get_resolution(index)
    query = text(DATASET_METADATA).bindparams(target=index, resolution=resolution)
    results = await session.execute(query)
    return [
        {
            "id": row[0],
            "name": row[1],
            # TODO: decide whether to defer this conversion to frontend, but currently there doesn't seem to be a convenient library
            "bbox": wkt.loads(row[2]).bounds,
            "source_org": row[3],
            "description": row[4],
            "files": row[5],
            "url": row[6],
            "accessibility": row[7],
            "date_start": row[8],
            "date_end": row[9],
        }
        for row in results.fetchall()
    ]


# TODO: rename method as it is already ambiguous compared to other endpoints'
@app.post("/h3_tiles/{z}/{x}/{y}")
async def get_h3_tiles(
    payload: H3TileRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    resolution = payload.resolution
    location = payload.location
    # dynamically constructing this expression is faster than deriving from
    # generate_series(0, :resolution) despite the latter resulting to more readable code
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(0, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = DATASET_COUNTS.format(
        parents_array=parents_comma_delimited,
        fill_query=FILL_RES2 if resolution == 2 else FILL
    )
    query = text(query).bindparams(z=z, x=x, y=y, resolution=resolution, location=location)
    results = await session.execute(query)
    return [{"index": row[0], "dataset_count": row[1]} for row in results.fetchall()]


@app.post("/dataset_coverage/{z}/{x}/{y}")
async def get_dataset_coverage(
    payload: DatasetRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    resolution = payload.resolution
    location = payload.location
    query = DATASET_COVERAGE.format(fill_query=FILL_RES2 if resolution == 2 else FILL)
    query = text(query).bindparams(z=z, x=x, y=y, location=location, resolution=resolution, dataset_id=payload.dataset_id)
    results = await session.execute(query)
    return [row[0] for row in results.fetchall()]


@app.post("/dataset_count/")
async def get_dataset_count(
    session: AsyncSession = Depends(get_async_session),
):
    results = await session.execute(text("SELECT COUNT(*) FROM datasets;"))
    return {"dataset_count": results.one()[0]}

if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")


@app.post("/datasets_by_location/")
async def get_datasets_by_location(
    payload: DatasetsByLocationRequest,
    session: AsyncSession = Depends(get_async_session),
):
    location = payload.location
    resolution = payload.resolution
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(0, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = f"""
WITH bounds AS (SELECT ST_GeomFromGeoJSON(CAST(:location AS TEXT)) bounds),
fill AS (SELECT h3_polygon_to_cells((SELECT bounds FROM bounds), :resolution) fill_index),
with_parents AS (
  SELECT fill_index, ARRAY[{parents_comma_delimited}] parents FROM fill GROUP BY fill_index
),
parent_datasets AS (
  SELECT dataset_id FROM h3_data JOIN with_parents ON h3_index = ANY(parents) GROUP BY dataset_id
),
children_datasets AS (
  SELECT dataset_id
  FROM h3_children_indicators
  JOIN fill ON h3_index = fill_index
  GROUP BY dataset_id
),
filtered_datasets AS (
  SELECT dataset_id id FROM parent_datasets
  UNION ALL
  SELECT dataset_id id FROM children_datasets
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
JOIN filtered_datasets
USING (id);
    """
    query = text(query).bindparams(location=location, resolution=resolution)
    results = await session.execute(query)
    return [
        {
            "id": row[0],
            "name": row[1],
            "bbox": wkt.loads(row[2]).bounds,
            "source_org": row[3],
            "description": row[4],
            "files": row[5],
            "url": row[6],
            "accessibility": row[7],
            "date_start": row[8],
            "date_end": row[9],
        }
        for row in results.fetchall()
    ]

import h3
import uvicorn
from app import settings
from app.db import get_async_session
from app.models import DatasetRequest, HealthCheck, H3TileRequest
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shapely import wkt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.sql.bbox_fill import FILL, FILL_RES2
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
    print(location)
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
    query = text(query).bindparams(z=z, x=x, y=y, resolution=resolution)
#     WITH bbox AS (
#   SELECT ST_Intersection(
#     ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326),
#     ST_GeomFromGeojson(:location)
#   ) bbox
# ),
# _fill AS (
#   SELECT h3_polygon_to_cells((SELECT bbox FROM bbox), CASE WHEN :resolution = 2 THEN 3 ELSE :resolution END) fill_index
# ),
# fill AS (
#   SELECT DISTINCT CASE WHEN :resolution = 2  THEN h3_cell_to_parent(fill_index, 2) ELSE fill_index END FROM _fill
# ),
# with_parents AS (
#   SELECT fill_index, ARRAY[{}] parents FROM fill GROUP BY fill_index
# ),
# parent_datasets AS (
#   SELECT fill_index, COUNT(dataset_id) dataset_count
#   FROM with_parents JOIN h3_data ON h3_index = ANY(parents) GROUP BY fill_index
# ),
# children_datasets AS (
#   SELECT fill_index, COUNT(dataset_id) dataset_count
#   FROM fill
#   JOIN h3_children_indicators ON h3_index = fill_index
#   GROUP BY fill_index
# )
# SELECT fill_index, (COALESCE(p.dataset_count, 0) + COALESCE(c.dataset_count, 0)) dataset_count FROM parent_datasets p
# FULL JOIN children_datasets c USING (fill_index);
#     """ if location else """
#     WITH bbox AS (
#   SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
# ),
# _fill AS (
#   SELECT h3_polygon_to_cells((SELECT bbox FROM bbox), CASE WHEN :resolution = 2 THEN 3 ELSE :resolution END) fill_index
# ),
# fill AS (
#   SELECT DISTINCT CASE WHEN :resolution = 2  THEN h3_cell_to_parent(fill_index, 2) ELSE fill_index END FROM _fill
# ),
# with_parents AS (
#   SELECT fill_index, ARRAY[{}] parents FROM fill GROUP BY fill_index
# ),
# parent_datasets AS (
#   SELECT fill_index, COUNT(dataset_id) dataset_count
#   FROM with_parents JOIN h3_data ON h3_index = ANY(parents) GROUP BY fill_index
# ),
# children_datasets AS (
#   SELECT fill_index, COUNT(dataset_id) dataset_count
#   FROM fill
#   JOIN h3_children_indicators ON h3_index = fill_index
#   GROUP BY fill_index
# )
# SELECT fill_index, (COALESCE(p.dataset_count, 0) + COALESCE(c.dataset_count, 0)) dataset_count FROM parent_datasets p
# FULL JOIN children_datasets c USING (fill_index);
    # bind_params = {
    #     "z": z,
    #     "x": x,
    #     "y": y,
    #     "resolution": resolution
    # }
    # if location:
    #     bind_params["location"] = location
    # query = query.bindparams(**bind_params)
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
    query = DATASET_COVERAGE.format(fill_query=FILL_RES2 if resolution == 2 else FILL)
    query = text(query).bindparams(z=z, x=x, y=y, resolution=resolution, dataset_id=payload.dataset_id)
    results = await session.execute(query)
    return [{"index": row[0]} for row in results.fetchall()]


@app.post("/dataset_count/")
async def get_dataset_count(
    session: AsyncSession = Depends(get_async_session),
):
    results = await session.execute(text("SELECT COUNT(*) FROM datasets;"))
    return {"dataset_count": results.one()[0]}

if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")

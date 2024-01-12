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
from app.sql.dataset_metadata import query as dataset_metadata_query
from app.sql.dataset_counts import query as dataset_count_query
from app.sql.dataset_coverage import query as dataset_coverage_query

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
    query = text(dataset_metadata_query).bindparams(target=index, resolution=resolution)
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
    # dynamically constructing this expression is faster than deriving from
    # generate_series(0, :resolution) despite the latter resulting to more readable code
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(0, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = text(dataset_count_query.format(parents_comma_delimited))
    query = query.bindparams(z=z, x=x, y=y, resolution=resolution)
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
    query = text(dataset_coverage_query).bindparams(z=z, x=x, y=y, resolution=payload.resolution, dataset_id=payload.dataset_id)
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

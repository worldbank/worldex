import h3
import uvicorn
from app import settings
from app.db import get_async_session
from app.models import DatasetRequest, HealthCheck, H3TileRequest
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.sql.datasets import query as datasets_query
from app.sql.dataset_counts import query as dataset_count_query
from app.sql.dataset_at_resolution import query as dataset_at_res_query

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
    query = text(datasets_query)
    query = query.bindparams(target=index, resolution=resolution)
    results = await session.execute(query)
    return [
        {
            "id": row[0],
            "name": row[1],
            "source_org": row[2],
            "description": row[3],
            "files": row[4],
            "url": row[5],
            "accessibility": row[6],
            "date_start": row[7],
            "date_end": row[8],
        }
        for row in results.fetchall()
    ]


# TODO: rename method
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


@app.post("/dataset/{z}/{x}/{y}")
async def get_dataset_tiles(
    payload: DatasetRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    resolution = payload.resolution
    dataset_id = payload.dataset_id
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(0, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = text(dataset_at_res_query.format(parents_comma_delimited))
    query = query.bindparams(z=z, x=x, y=y, resolution=resolution, dataset_id=dataset_id)
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

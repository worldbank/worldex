import h3
import uvicorn
from app import settings
from app.db import get_async_session
from app.models import HealthCheck, H3TileRequest
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

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
    query = text(
        f"""
        WITH with_parents AS (
            SELECT :target target_index, h3_cell_to_parent(CAST(:target AS H3INDEX), generate_series(0, :resolution)) parent
        ),
        parent_datasets AS (
            SELECT dataset_id FROM h3_data WHERE h3_index = ANY(ARRAY(SELECT parent from with_parents))
        ),
        children_datasets AS (
            SELECT dataset_id FROM h3_data
            WHERE h3_get_resolution(h3_index) > :resolution
            AND h3_cell_to_parent(h3_index, :resolution) = CAST(:target AS H3INDEX)
        ),
        dataset_ids AS (
            SELECT dataset_id FROM parent_datasets
            UNION
            SELECT dataset_id FROM children_datasets
        )
        SELECT id, name, source_org, description, files FROM datasets WHERE id = ANY(ARRAY(SELECT * FROM dataset_ids));
        """
    )
    query = query.bindparams(target=index, resolution=resolution)
    results = await session.execute(query)
    return [
        {"id": row[0], "name": row[1], "source_org": row[2], "description": row[3], "files": row[4]}
        for row in results.fetchall()
    ]


@app.post("/h3_tiles/{z}/{x}/{y}")
async def get_h3_tiles(
    payload: H3TileRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    resolution = payload.resolution
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(1, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = text(
        f"""
        WITH bbox AS (
            SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
        ),
        fill AS (
            SELECT h3_polygon_to_cells((SELECT bbox FROM bbox), :resolution) fill_index
        ),
        with_parents AS (
            SELECT fill_index, ARRAY[{parents_comma_delimited}] parents FROM fill GROUP BY fill_index
        ),
        parent_datasets AS (
            SELECT fill_index, ARRAY_AGG(dataset_id) dataset_ids FROM with_parents JOIN h3_data ON h3_index = ANY(parents) GROUP BY fill_index
        ),
        children_datasets AS (
            SELECT fill_index, ARRAY_AGG(datasets.id) dataset_ids
            FROM fill
            JOIN datasets ON ST_Within(fill_index::geometry, ST_SetSRID(datasets.bbox, 4326))
            AND EXISTS(
                SELECT 1 FROM h3_data WHERE
                dataset_id = datasets.id
                AND (
                    h3_get_resolution(h3_index) > :resolution AND h3_cell_to_parent(h3_index, :resolution) = fill_index
                )
            )
            GROUP BY fill_index
        )
        SELECT COALESCE(parent_datasets.fill_index, children_datasets.fill_index) AS index, ARRAY_LENGTH(ARRAY_CAT(
            COALESCE(parent_datasets.dataset_ids, ARRAY[]::int[]),
            COALESCE(children_datasets.dataset_ids, ARRAY[]::int[])
        ), 1) dataset_count
        FROM parent_datasets
        FULL JOIN children_datasets
        ON parent_datasets.fill_index = children_datasets.fill_index
        """
    )
    query = query.bindparams(z=z, x=x, y=y, resolution=resolution)
    results = await session.execute(query)
    return [{"index": row[0], "dataset_count": row[1]} for row in results.fetchall()]


if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")

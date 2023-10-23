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


@app.post("/h3_tiles/{z}/{x}/{y}")
async def get_h3_tiles(
    payload: H3TileRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    query = text(
        f"""
        SELECT h3_index, dataset_count FROM h3_data_res{payload.resolution}
        WHERE ST_WITHIN(h3_index::geometry, ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326))
        """
    )
    query = query.bindparams(z=z, x=x, y=y)
    resolution = payload.resolution
    parents_array = ["filldex"] + [
        f"h3_cell_to_parent(filldex, {res})" for res in range(1, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = text(
        f"""
        WITH bbox AS (
            SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
        ),
        fill AS (
            SELECT h3_polygon_to_cells((SELECT bbox FROM bbox), :resolution) filldex
        ),
        joined AS (
            SELECT filldex, datasets.id
            FROM fill
            JOIN datasets
            ON ST_Intersects(h3_cell_to_geometry(filldex), st_setsrid(datasets.bbox, 4326))
            WHERE EXISTS(
                SELECT 1 FROM h3_data WHERE
                dataset_id = datasets.id
                AND (
                    h3_get_resolution(h3_data.h3_index) > :resolution
                    AND h3_cell_to_parent(h3_index, :resolution) = filldex
                )
            )
        ),
        children_counted AS (SELECT filldex, ARRAY_AGG(id) dataset_ids FROM joined GROUP BY filldex),
        parented AS (
            SELECT filldex, UNNEST(ARRAY[{parents_comma_delimited}]) parent FROM fill GROUP BY filldex
        ),
        parent_counted AS (
            SELECT filldex, ARRAY_AGG(DISTINCT dataset_id) dataset_ids FROM parented JOIN h3_data ON h3_data.h3_index = parent GROUP BY filldex
        )
        SELECT
        CASE WHEN parent_counted.filldex IS NULL THEN children_counted.filldex ELSE parent_counted.filldex END AS index,
        ARRAY_LENGTH(ARRAY_CAT(
            CASE WHEN children_counted.dataset_ids IS NULL THEN ARRAY[]::int[] ELSE children_counted.dataset_ids END,
            CASE WHEN parent_counted.dataset_ids IS NULL THEN ARRAY[]::int[] ELSE parent_counted.dataset_ids END
        ), 1)
        FROM children_counted
        FULL JOIN parent_counted ON children_counted.filldex = parent_counted.filldex
        """
    )
    query = query.bindparams(z=z, x=x, y=y, resolution=resolution)
    results = await session.execute(query)
    return [{"index": row[0], "dataset_count": row[1]} for row in results.fetchall()]


if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")

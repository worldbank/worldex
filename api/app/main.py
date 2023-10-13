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
        """
        WITH uncompacted AS (
            SELECT h3_uncompact_cells(array_agg(h3_index), :resolution) h3_index, dataset_id
            FROM h3_data WHERE h3_get_resolution(h3_index) < :resolution
            GROUP BY dataset_id
        ),
        parents AS (
            SELECT h3_cell_to_parent(h3_index, :resolution) h3_index, COUNT(DISTINCT(dataset_id)) count
            FROM h3_data
            WHERE h3_get_resolution(h3_index) >= :resolution
            GROUP BY h3_cell_to_parent(h3_index, :resolution)
        ),
        combined AS (
            SELECT h3_index, COUNT(DISTINCT(dataset_id)) count
            FROM uncompacted
            GROUP BY h3_index
            UNION
            SELECT h3_index, count FROM parents
        )
        SELECT h3_index, SUM(count)
        FROM combined
        WHERE ST_WITHIN(h3_index::geometry, ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326))
        GROUP BY h3_index
        """
    )
    query = query.bindparams(z=z, x=x, y=y, resolution=payload.resolution)
    results = await session.execute(query)
    return [{"index": row[0], "dataset_count": row[1]} for row in results.fetchall()]


if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")

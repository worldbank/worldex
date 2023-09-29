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


origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
    should_count = payload.should_count
    query = text(
        """
        WITH bbox AS (
            SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) bbox
        )
        SELECT h3_index, COUNT(DISTINCT(dataset_id)) dataset_count
        FROM h3_data
        WHERE h3_get_resolution(h3_index) = :resolution AND ST_WITHIN(h3_index::geometry, (SELECT bbox FROM bbox))
        GROUP BY h3_index;
        """
    )
    query = query.bindparams(z=z, x=x, y=y, resolution=payload.resolution)
    results = await session.execute(query)
    return [
        {"index": row[0], "dataset_count": row[1]}
        if should_count
        else {"index": row[0]}
        for row in results.fetchall()
    ]


if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")

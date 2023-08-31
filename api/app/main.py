import uvicorn
from app import settings
from app.db import get_async_session
from app.models import HealthCheck, H3TileRequest
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

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
    query = text(
        """
        WITH bbox AS (
            SELECT ST_Transform(ST_TileEnvelope(:z, :x, :y), 4326) AS bbox
        ),
        count AS (
            SELECT h3_cell_to_parent(h3_index, :resolution) parent, COUNT(DISTINCT(dataset_id)) FROM h3_data
            WHERE ST_WITHIN(
                h3_index::geometry,
                (SELECT bbox FROM bbox)
            ) GROUP BY parent
        )
        SELECT * FROM count WHERE ST_WITHIN(parent::geometry, (SELECT bbox FROM bbox));
        """
    )
    query = query.bindparams(z=z, x=x, y=y, resolution=payload.resolution)
    results = await session.execute(query)
    return [{"index": row[0], "dataset_count": row[1]} for row in results.fetchall()]


if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")

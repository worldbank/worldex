import uvicorn
from app import settings
from app.db import get_async_session
from app.models import HealthCheck, H3TileRequest
from app.services import get_h3_resolution
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    h3_resolution = payload.resolution
    results = await session.execute(
        f"""
        WITH parents AS (
            SELECT h3_polygon_to_cells(ST_Transform(ST_TileEnvelope({z}, {x}, {y}), 4326), {h3_resolution}) h3
        )
        SELECT parents.h3, COUNT(DISTINCT(h3_data.dataset_id)) dataset_count
        FROM h3_data
        JOIN parents ON h3_cell_to_parent(h3_data.h3_index, {h3_resolution}) = parents.h3 GROUP BY parents.h3;
    """
    )
    return [{"index": row[0], "dataset_count": row[1]} for row in results.fetchall()]


if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")

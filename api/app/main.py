import uvicorn
from app import settings
from app.models import HealthCheck
from app.routers import dataset, filters, raster, search
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    openapi_url=settings.openapi_url,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router)
app.include_router(filters.router)
app.include_router(raster.router)
app.include_router(search.router)


@app.get("/health_check", response_model=HealthCheck)
async def health_check():
    return {
        "name": settings.project_name,
        "version": settings.version,
    }

if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")
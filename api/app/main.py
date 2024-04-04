import urllib
from io import BytesIO

import cv2
import numpy as np
import rasterio
import uvicorn
from app import settings
from app.db import get_async_session
from app.models import (
    Dataset,
    DatasetCountRequest,
    DatasetCountTile,
    DatasetRequest,
    DatasetsByLocationRequest,
    HealthCheck,
    TifAsPngRequest,
)
from app.services import (
    dataset_count_to_bytes,
    get_dataset_count_tiles_async,
    img_to_data_url,
)
from app.sql.bounds_fill import FILL, FILL_RES2
from app.sql.dataset_counts import DATASET_COUNTS
from app.sql.dataset_coverage import DATASET_COVERAGE
from app.sql.dataset_metadata import DATASET_METADATA
from app.sql.datasets_by_location import (
    DATASETS_BY_LOCATION,
    LOCATION_FILL,
    LOCATION_FILL_RES2,
)
from fastapi import Depends, FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from rasterio.warp import Resampling, reproject
from shapely import wkt
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    # disable for prod
    # openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins.split(","),
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
    query = text(DATASET_METADATA).bindparams(target=index)
    results = await session.execute(query)
    return [
        dict(
            row._mapping,
            bbox=wkt.loads(row._mapping['bbox']).bounds
        )
        for row in results.fetchall()
    ]


@app.post("/dataset_counts/{z}/{x}/{y}")
async def get_dataset_counts(
    payload: DatasetCountRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    filters = {}
    if payload.source_org:
        filters["source_org"] = payload.source_org
    location = payload.location
    should_hit_cache = not (payload.ignore_cache or location or filters)
    cached_tile = None
    if should_hit_cache:
        cached_tile = await session.execute(
            select(DatasetCountTile.dataset_counts).where(
                DatasetCountTile.z == z,
                DatasetCountTile.x == x,
                DatasetCountTile.y == y,
            )
        )
    header_kwargs = {}
    if cached_tile:
        dataset_count_bytes = cached_tile.scalar()
        header_kwargs = {"headers": {"X-Tile-Cache-Hit": "true"}}
    else:
        resolution = payload.resolution
        results = await get_dataset_count_tiles_async(session, z, x, y, resolution, location, filters)
        if payload.debug_json_response:
            return [row._mapping for row in results]
        dataset_counts = {'index': [], 'dataset_count': []}

        for row in results:
            mapping = row._mapping
            dataset_counts['index'].append(mapping.index)
            dataset_counts['dataset_count'].append(mapping.dataset_count)
        dataset_count_bytes = dataset_count_to_bytes(dataset_counts)
        if should_hit_cache:
            async with session:
                dataset_count_tile = DatasetCountTile(
                    z=z,
                    x=x,
                    y=y,
                    dataset_counts=dataset_count_bytes,
                )
                session.add(dataset_count_tile)
                await session.commit()
    return Response(
        content=dataset_count_bytes, media_type="application/octet-stream", **header_kwargs
    )


@app.post("/dataset_coverage/{z}/{x}/{y}")
async def get_dataset_coverage(
    payload: DatasetRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    resolution = payload.resolution
    location = payload.location
    query = DATASET_COVERAGE.format(fill_query=FILL_RES2 if resolution == 2 else FILL)
    query = text(query).bindparams(z=z, x=x, y=y, location=location, resolution=resolution, dataset_id=payload.dataset_id)
    results = await session.execute(query)
    return [row[0] for row in results.fetchall()]


@app.post("/dataset_count/")
async def get_dataset_count(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(func.count(Dataset.id)))
    return {"dataset_count": result.scalar_one()}


@app.post("/datasets_by_location/")
async def get_datasets_by_location(
    payload: DatasetsByLocationRequest,
    session: AsyncSession = Depends(get_async_session),
):
    location = payload.location
    resolution = payload.resolution
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(0, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = DATASETS_BY_LOCATION.format(
        parents_array=parents_comma_delimited,
        fill_query=LOCATION_FILL_RES2 if resolution == 2 else LOCATION_FILL
    )
    query = text(query).bindparams(location=location, resolution=resolution)
    results = await session.execute(query)
    return [
        dict(
            row._mapping,
            bbox=wkt.loads(row._mapping['bbox']).bounds
        )
        for row in results.fetchall()
    ]


@app.post("/tif_as_png/")
async def get_tif_as_png(
    payload: TifAsPngRequest,
):
    url = payload.url
    with urllib.request.urlopen(url) as resp:
        response = resp.read()
        # rasterio.open() with a url results to the following error message for some files:
        # Range downloading not supported by this server!
        with rasterio.open(BytesIO(response)) as src:
            # assumes a single band
            _img = src.read(1)
            web_mercator = rasterio.CRS.from_epsg(3857)

            img = _img.copy()
            if src.meta['crs'] != web_mercator:
                dst_transform, dst_width, dst_height = rasterio.warp.calculate_default_transform(
                    src.crs, web_mercator, src.width, src.height, *src.bounds
                )
                img = np.zeros((dst_height, dst_width))

                reproject(
                    source=_img,
                    destination=img,
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=dst_transform,
                    dst_crs=web_mercator,
                    resampling=Resampling.nearest
                )

            alpha = img != src.nodata
            alpha = np.uint8(alpha)
            alpha[alpha!=0] = 255

            # assumes float, should handle otherwise
            info = np.finfo(img.dtype)
            # normalize then scale to preserve dynamic range
            img_normalized = img.astype(np.float64) / info.max
            img_normalized = 255 * img
            img_normalized = img.astype(np.uint8)
            img_colorized = cv2.applyColorMap(img_normalized, cv2.COLORMAP_VIRIDIS)
            b, g, r = cv2.split(img_colorized)
            img_bgra = cv2.merge((b, g, r, alpha))

            return {
                "data_url": img_to_data_url(img_bgra),
                "bbox": src.bounds,  # [west, south, east, north]
            }

if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")
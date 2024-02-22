import h3
import uvicorn
from app import settings
from app.db import get_async_session
from app.models import DatasetRequest, HealthCheck, H3TileRequest, DatasetsByLocationRequest, TifAsPngRequest
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shapely import wkt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.sql.bounds_fill import FILL, FILL_RES2
from app.sql.datasets_by_location import LOCATION_FILL, LOCATION_FILL_RES2, DATASETS_BY_LOCATION
from app.sql.dataset_metadata import DATASET_METADATA
from app.sql.dataset_counts import DATASET_COUNTS
from app.sql.dataset_coverage import DATASET_COVERAGE
import cv2
import rasterio
import urllib
import numpy as np
from io import BytesIO
import requests
import base64
from app.services import img_to_data_url
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform_bounds
from rasterio.windows import from_bounds


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
    query = text(DATASET_METADATA).bindparams(target=index, resolution=resolution)
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
    location = payload.location
    # dynamically constructing this expression is faster than deriving from
    # generate_series(0, :resolution) despite the latter resulting to more readable code
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(0, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = DATASET_COUNTS.format(
        parents_array=parents_comma_delimited,
        fill_query=FILL_RES2 if resolution == 2 else FILL
    )
    query = text(query).bindparams(z=z, x=x, y=y, resolution=resolution, location=location)
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
    results = await session.execute(text("SELECT COUNT(*) FROM datasets;"))
    return {"dataset_count": results.one()[0]}

if __name__ == "__main__":
    uvicorn.run(app, port=8000, host="0.0.0.0")


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
        {
            "id": row[0],
            "name": row[1],
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

            info = np.finfo(img.dtype) # Get the information of the incoming image type
            img_normalized = img.astype(np.float64) / info.max # normalize the data to 0 - 1
            img_normalized = 255 * img # Now scale by 255
            img_normalized = img.astype(np.uint8)
            img_colorized = cv2.applyColorMap(img_normalized, cv2.COLORMAP_VIRIDIS)
            b, g, r = cv2.split(img_colorized)
            img_bgra = cv2.merge((b, g, r, alpha))

            return {
                "data_url": img_to_data_url(img_bgra),
                "bbox": src.bounds,  # [west, south, east, north]
            }

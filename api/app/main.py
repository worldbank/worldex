import urllib
from io import BytesIO

import cv2
import numpy as np
import rasterio
import uvicorn
from app import settings
from app.models import HealthCheck, TifAsPngRequest
from app.routers import dataset, filters
from app.services import img_to_data_url
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from rasterio.warp import Resampling, reproject

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

app.include_router(dataset.router)
app.include_router(filters.router)


@app.get("/health_check", response_model=HealthCheck)
async def health_check():
    return {
        "name": settings.project_name,
        "version": settings.version,
    }


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
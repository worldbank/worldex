from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
import rasterio as rio
from h3ronpy.arrow import cells_to_string
from h3ronpy.pandas.raster import raster_to_dataframe

from ..types import File
from .base import BaseHandler


class RasterHandler(BaseHandler):
    def __init__(self, rio_src, resolution: Optional[int] = None) -> None:
        # h3 indexes are standardized to use epsg:4326 projection
        if rio_src.crs != "EPSG:4326":
            self.src = rio.vrt.WarpedVRT(rio_src, crs="EPSG:4326")
        else:
            self.src = rio_src
        self.resolution = resolution

    @classmethod
    def from_file(cls, file: File, resolution: Optional[int] = None):
        src = rio.open(file)
        return cls(src, resolution)

    def get_resolution(self) -> int:
        if self.resolution is None:
            return self.default_resolution
        return self.resolution

    def h3index(self) -> List[int]:
        # TODO: Improve default values of this
        # TODO: compare perfomance difference between this and
        # vectorizing the raster 1st using rasterio.features.shapes
        h3_df = raster_to_dataframe(
            self.src.read(1),
            self.src.transform,
            self.get_resolution(),
            nodata_value=self.src.nodata,
            compact=False,
        )
        return cells_to_string(h3_df.cell.unique()).tolist()

    def h3index_windowed(self, window_dim: Tuple[int, int]) -> List[int]:
        [left, bottom, right, top] = self.src.bounds
        x_range, x_step = np.linspace(left, right, window_dim[0], retstep=True)
        y_range, y_step = np.linspace(bottom, top, window_dim[1], retstep=True)
        h3ids = []
        for x in x_range:
            for y in y_range:
                # logger.info("Indexing window: left: %s, bottom:%s, right:%s, top:%s", x, y, x + x_step, y + y_step)
                window = self.src.window(x, y, x + x_step, y + y_step)
                win_transform = self.src.window_transform(window)
                h3_df = raster_to_dataframe(
                    self.src.read(1, window=window),
                    win_transform,
                    self.get_resolution(),
                    nodata_value=self.src.nodata,
                    compact=False,
                )
            h3ids.append(cells_to_string(h3_df.cell).tolist())
        return np.unique(np.concatenate(h3ids, axis=None))

    @property
    def bbox(self) -> Tuple[float, float, float, float]:
        return tuple(self.src.bounds)

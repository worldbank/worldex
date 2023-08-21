from typing import List, Optional

import rasterio as rio
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

    @classmethod
    def from_rasterio(cls, src, resolution: Optional[int] = None):
        return cls(src, resolution)

    def get_resolution(self) -> int:
        if self.resolution is None:
            return self.default_resolution
        return self.resolution

    def h3index(self) -> List[int]:
        # TODO: Improve default values of this
        h3_df = raster_to_dataframe(
            self.src.read(1),
            self.src.transform,
            self.get_resolution(),
            nodata_value=0,
            axis_order="xy",
            compact=False,
        )
        return h3_df.cell.unique().tolist()

from typing import Optional, List

import geopandas as gpd
from h3ronpy.arrow.vector import wkb_to_cells

from .base import BaseHandler
from ..types import File


# Possible column names for a csv file
POSSIBLE_X = ["x", "lon", "lng", "longitude"]
POSSIBLE_Y = ["y", "lat", "latitude"]
POSSIBLE_GEOM = ["geometry", "geo", "geom", "geography", "wkt"]


class VectorHandler(BaseHandler):
    @classmethod
    def from_csv(cls, file: File, resolution: Optional[int] = None):
        """CSVs are a special case"""
        possible_x = ",".join(POSSIBLE_X)
        possible_y = ",".join(POSSIBLE_Y)
        gdf = gpd.read_file(
            file, driver="CSV", x_possible_names=possible_x, y_possible_name=possible_y
        )
        return cls(gdf, resolution)

    def get_resolution(self) -> int:
        if self.resolution is None:
            return self.default_resolution
        return self.resolution

    def h3index(self) -> List[int]:
        """Safe to assume gps files are only a list of points"""
        # TODO: Measure perfomance differences of using
        # self.gdf.geometry.unary_union.to_wkb() for large files
        cells = (
            wkb_to_cells(self.gdf.geometry.to_wkb(), resolution=self.get_resolution())
            .flatten()
            .unique()
            .to_pylist()
        )
        return cells

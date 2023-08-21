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
    def __init__(self, gdf: gpd.GeoDataFrame, resolution: Optional[int] = None) -> None:
        # h3 indexes are standardized to use epsg:4326 projection
        self.gdf = gdf.to_crs(epsg=4326)
        self.resolution = resolution

    @classmethod
    def from_file(cls, file: File, resolution: Optional[int] = None):
        gdf = gpd.read_file(file)
        return cls(gdf, resolution)

    @classmethod
    def from_geodataframe(cls, gdf: gpd.GeoDataFrame, resolution: Optional[int] = None):
        return cls(gdf, resolution)

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
        # TODO: Measure perfomance differences of using
        # self.gdf.geometry.unary_union.to_wkb() for large files
        cells = (
            wkb_to_cells(self.gdf.geometry.to_wkb(), resolution=self.get_resolution())
            .flatten()
            .unique()
            .to_pylist()
        )
        return cells

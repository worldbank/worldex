from pathlib import Path
from typing import List, Optional

import geopandas as gpd
from h3ronpy.arrow import cells_to_string
from h3ronpy.arrow.vector import wkb_to_cells
from shapely import Geometry

from ..types import File
from .base import BaseHandler

# Possible column names for a csv file
POSSIBLE_X = ["x", "lon", "lng", "longitude"]
POSSIBLE_Y = ["y", "lat", "latitude"]
POSSIBLE_GEOM = ["geometry", "geo", "geom", "geography", "wkt", "wkb", "ewkb", "json"]


BUFFER_SIZE = 0.0000000001


def process_geometry(geom: Geometry) -> Geometry:
    if geom.geom_type in ["MultiLineString", "LineString"]:
        return geom.buffer(BUFFER_SIZE)
    else:
        return geom


class VectorHandler(BaseHandler):
    def __init__(self, gdf: gpd.GeoDataFrame, resolution: Optional[int] = None) -> None:
        # h3 indexes are standardized to use epsg:4326 projection
        self.gdf = gdf.to_crs(epsg=4326)
        self.resolution = resolution

    @classmethod
    def from_file(cls, file: File, resolution: Optional[int] = None):
        if isinstance(file, str):
            file = Path(file)
        if file.suffix == ".csv":
            return cls.from_csv(file, resolution)
        else:
            gdf = gpd.read_file(file)
            return cls(gdf, resolution)

    @classmethod
    def from_csv(cls, file: File, resolution: Optional[int] = None):
        """CSVs are a special case"""
        possible_x = ",".join(POSSIBLE_X)
        possible_y = ",".join(POSSIBLE_Y)
        possible_geometry = ",".join(POSSIBLE_GEOM)
        gdf = gpd.read_file(
            file,
            driver="CSV",
            x_possible_names=possible_x,
            y_possible_names=possible_y,
            geom_possible_names=possible_geometry,
        )
        gdf.set_crs(epsg=4326, inplace=True)
        return cls(gdf, resolution)

    def get_resolution(self) -> int:
        if self.resolution is None:
            return self.default_resolution
        return self.resolution

    def h3index(self) -> List[int]:
        # TODO: Measure perfomance differences of using self.gdf.geometry.unary_union.to_wkb() for large files
        # TODO: Measure perfomance degradation of using process_geometry/ geom.buffer for large files
        cells = cells_to_string(
            wkb_to_cells(
                self.gdf.geometry.apply(process_geometry).to_wkb(),
                resolution=self.get_resolution(),
            )
            .flatten()
            .unique()
        ).to_pylist()
        return cells

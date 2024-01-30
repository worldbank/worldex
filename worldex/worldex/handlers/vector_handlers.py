from pathlib import Path
from typing import List, Optional, Tuple

import geopandas as gpd
import pandas as pd
from h3ronpy.arrow import cells_to_string
from h3ronpy.arrow.vector import wkb_to_cells
from shapely import Geometry, wkb

from ..types import File
from .base import BaseHandler

# Possible column names for a csv file
POSSIBLE_X = ["x", "lon", "lng", "longitude"]
POSSIBLE_Y = ["y", "lat", "latitude"]
POSSIBLE_GEOM = ["geometry", "geo", "geom", "geography", "wkt", "wkb", "ewkb", "json"]


BUFFER_SIZE = 0.0000000001


def process_geometry(geom: Geometry) -> Geometry:
    # drop z axis
    if geom.has_z:
        geom = wkb.loads(wkb.dumps(geom, output_dimension=2))
    if geom.geom_type in ["MultiLineString", "LineString"]:
        return geom.buffer(BUFFER_SIZE)
    else:
        return geom


class VectorHandler(BaseHandler):
    def __init__(self, gdf: gpd.GeoDataFrame, resolution: Optional[int] = None) -> None:
        # h3 indexes are standardized to use epsg:4326 projection
        if gdf.crs is None:
            # TODO: add warnging if no crs exists
            self.gdf = gdf.set_crs(epsg=4326)
        else:
            self.gdf = gdf.to_crs(epsg=4326)
        self.resolution = resolution

    @classmethod
    def from_file(cls, file: File, resolution: Optional[int] = None):
        if isinstance(file, str):
            file = Path(file)
        try:
            if file.suffix == ".csv":
                return cls.from_csv(file, resolution)
        except AttributeError:
            pass
        finally:
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
            crs="EPSG:4326",
        )
        return cls(gdf, resolution)

    @classmethod
    def from_excel(cls, file: File, resolution: Optional[int] = None):
        df = pd.read_excel(file)
        x_best_match = next(
            (col for col in df.columns if col.lower() in POSSIBLE_X), None
        )
        y_best_match = next(
            (col for col in df.columns if col.lower() in POSSIBLE_Y), None
        )
        if x_best_match and y_best_match:
            gdf = gpd.GeoDataFrame(
                geometry=gpd.GeoSeries.from_xy(df[x_best_match], df[y_best_match]),
                crs="EPSG:4326",
            )
            return cls(gdf, resolution)
        geom_best_match = next(
            (col for col in df.columns if col.lower() in POSSIBLE_GEOM), None
        )
        if geom_best_match:
            gpd.GeoDataFrame(
                geometry=gpd.GeoSeries.from_wkt(df[geom_best_match]), crs="EPSG:4326"
            )
            return cls(gdf, resolution)
        raise ValueError("Cannot convert excel file to geopandas")

    def get_resolution(self) -> int:
        if self.resolution is None:
            return self.default_resolution
        return self.resolution

    def h3index(self) -> List[int]:
        # TODO: Measure perfomance differences of using self.gdf.geometry.unary_union.to_wkb() for large files
        # TODO: Measure perfomance degradation of using process_geometry/ geom.buffer for large files
        geom = self.gdf.geometry[~self.gdf.geometry.isnull()]
        cells = cells_to_string(
            wkb_to_cells(
                geom.apply(process_geometry).to_wkb(),
                resolution=self.get_resolution(),
            )
            .flatten()
            .unique()
        ).to_pylist()
        return cells

    @property
    def bbox(self) -> Tuple[float, float, float, float]:
        return tuple(self.gdf.total_bounds)

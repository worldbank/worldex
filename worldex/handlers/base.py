from ..types import File
from typing import Optional
import geopandas as gpd


class BaseHandler:
    default_resolution: int = 8

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

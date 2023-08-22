import geopandas as gpd
import pytest
from shapely.geometry import Polygon

from worldex.handlers.vector_handlers import VectorHandler


@pytest.fixture
def shp_test_file(tmp_path):
    polygon = Polygon([[0, 0], [0, 0.01], [0.01, 0.01]])
    polygon2 = Polygon([[0.02, 0.02], [0.01, 0.01], [0.01, 0.02]])
    shp_path = tmp_path / "test.shp"
    gdf = gpd.GeoDataFrame(geometry=[polygon, polygon2], crs=4326)
    gdf.to_file(shp_path)
    yield shp_path


def test_shp_handler(shp_test_file):
    handler = VectorHandler.from_file(shp_test_file)
    assert set(handler.h3index()) == {
        "88754e64d9fffff",
        "88754e6499fffff",
        "88754e64dbfffff",
        "88754e64d7fffff",
        "88754e64d3fffff",
        "88754a9365fffff",
        "88754e66b3fffff",
        "88754a936dfffff",
        "88754e64d1fffff",
        "88754e66b7fffff",
    }


def test_shp_handler_diff_resolution(shp_test_file):
    handler = VectorHandler.from_file(shp_test_file, resolution=4)
    assert set(handler.h3index()) == {"84754e7ffffffff", "84754a9ffffffff"}

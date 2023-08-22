import geopandas as gpd
import pytest
from shapely.geometry import LineString, MultiPolygon, Point, Polygon

from worldex.handlers.vector_handlers import VectorHandler


@pytest.fixture
def gpkg_test_file(tmp_path):
    polygon = Polygon([[0, 0], [0, 0.01], [0.01, 0.01]])
    line = LineString([[-0.01, -0.01], [0.01, 0], [0.02, 0.02]])
    point = Point([-0.02, -0.02])
    polygon2 = Polygon([[0.02, 0.02], [0.01, 0.01], [0.01, 0.02]])
    multipolygon = MultiPolygon([polygon, polygon2])
    gpkg_path = tmp_path / "test.gpkg"
    gdf = gpd.GeoDataFrame(geometry=[line, point, polygon, multipolygon], crs=4326)
    gdf.to_file(gpkg_path, driver="GPKG")
    yield gpkg_path


def test_gpkg_handler(gpkg_test_file):
    handler = VectorHandler.from_file(gpkg_test_file)
    assert set(handler.h3index()) == {
        "88754e6491fffff",
        "88754a932dfffff",
        "88754a9325fffff",
        "88754e64dbfffff",
        "88754e6499fffff",
        "88754e64d9fffff",
        "88754e66b7fffff",
        "88754a9161fffff",
        "88754a9365fffff",
        "88754e66b3fffff",
        "88754e64d3fffff",
        "88754e64d7fffff",
        "88754a936dfffff",
        "88754a9367fffff",
        "88754e64d1fffff",
    }


def test_gpkg_handler_diff_resolution(gpkg_test_file):
    handler = VectorHandler.from_file(gpkg_test_file, resolution=4)
    assert set(handler.h3index()) == {"84754e7ffffffff", "84754a9ffffffff"}

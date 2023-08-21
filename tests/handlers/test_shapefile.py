import geopandas as gpd
from shapely.geometry import Point, Polygon, LineString, MultiPolygon
import pytest
from worldex.handlers.vector_handlers import VectorHandler


@pytest.fixture
def shp_test_file(tmp_path):
    polygon = Polygon([[0, 0], [0, 0.01], [0.01, 0.01]])
    polygon2 = Polygon([[0.02, 0.02], [0.01, 0.01], [0.01, 0.02]])
    gpkg_path = tmp_path / "test.shp"
    gdf = gpd.GeoDataFrame(geometry=[polygon, polygon2], crs=4326)
    gdf.to_file(gpkg_path)
    yield gpkg_path


def test_shp_handler(shp_test_file):
    gpshandler = VectorHandler.from_file(shp_test_file)
    assert set(gpshandler.h3index()) == {
        614552959897829375,
        614552959906217983,
        614553222213795839,
        614553222272516095,
        614553222274613247,
        614553222278807551,
        614553222280904703,
        614553222283001855,
        614553222777929727,
        614553222782124031,
    }


def test_shp_handler_diff_resolution(shp_test_file):
    gpshandler = VectorHandler.from_file(shp_test_file, resolution=4)
    assert set(gpshandler.h3index()) == {596538564771053567, 596538831059025919}

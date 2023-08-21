import geopandas as gpd
from shapely.geometry import Point, Polygon, LineString, MultiPolygon
import pytest
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
        614553222280904703,
        614553222777929727,
        614553222782124031,
        614552959897829375,
        614552959906217983,
        614552959830720511,
        614553222205407231,
        614553222213795839,
        614552959356764159,
        614553222272516095,
        614553222274613247,
        614553222278807551,
        614553222283001855,
        614552959839109119,
        614552959899926527,
    }


def test_gpkg_handler_diff_resolution(gpkg_test_file):
    handler = VectorHandler.from_file(gpkg_test_file, resolution=4)
    assert set(handler.h3index()) == {596538564771053567, 596538831059025919}

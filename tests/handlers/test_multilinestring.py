"""H3 is known for not working with linestring and multi line strings.

These tests ensure that we capture the results properly.
"""

import geopandas as gpd
from shapely.geometry import LineString, MultiLineString

from worldex.handlers.vector_handlers import VectorHandler


def test_linestring():
    line = LineString([[0, 0], [0, 0.01], [0.01, 0.01]])
    gdf = gpd.GeoDataFrame(geometry=[line], crs=4326)
    handler = VectorHandler(gdf)

    assert set(handler.h3index()) == {
        "88754e6499fffff",
        "88754e64d1fffff",
        "88754e64d3fffff",
        "88754e64d7fffff",
        "88754e64dbfffff",
    }


def test_multilinestring():
    line1 = LineString([[0, 0], [0, 0.01], [0.01, 0.01]])
    line2 = LineString([[-0.01, -0.01], [-0.05, -0.05], [-0.05, 0.01]])
    line3 = LineString([[0.05, 0.05], [0.05, 0.01]])
    multi_line = MultiLineString([line1, line2, line3])
    gdf = gpd.GeoDataFrame(geometry=[multi_line], crs=4326)
    handler = VectorHandler(gdf)

    assert set(handler.h3index()) == {
        "88754a9125fffff",
        "88754a912dfffff",
        "88754a9161fffff",
        "88754a9167fffff",
        "88754a9169fffff",
        "88754a916dfffff",
        "88754a9a09fffff",
        "88754a9a0bfffff",
        "88754a9a11fffff",
        "88754a9a13fffff",
        "88754a9a1bfffff",
        "88754a9a1dfffff",
        "88754a9a45fffff",
        "88754a9a47fffff",
        "88754e29a1fffff",
        "88754e29a3fffff",
        "88754e29adfffff",
        "88754e29b5fffff",
        "88754e6491fffff",
        "88754e6493fffff",
        "88754e6497fffff",
        "88754e6499fffff",
        "88754e64d1fffff",
        "88754e64d3fffff",
        "88754e64d7fffff",
        "88754e64dbfffff",
        "88754e6591fffff",
        "88754e6593fffff",
        "88754e66d9fffff",
        "88754e66dbfffff",
    }

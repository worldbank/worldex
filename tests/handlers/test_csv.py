import os
from worldex.handlers.vector_handlers import VectorHandler


def test_csv_lat_lng(tmp_path):
    csv_string = """lat,lng,name
0,0,point1
0.1,0.1,point2
"""
    csv_path = tmp_path / "test.csv"
    with open(csv_path, "w") as f:
        f.write(csv_string)
    handler = VectorHandler.from_file(csv_path)
    assert set(handler.h3index()) == {614553222213795839, 614553206816505855}


def test_csv_wkt(tmp_path):
    csv_string = """WKT,name
Point(0 0),point1
Point(0.1 0.1),point2
"""
    csv_path = tmp_path / "test.csv"
    with open(csv_path, "w") as f:
        f.write(csv_string)
    handler = VectorHandler.from_file(csv_path)
    assert set(handler.h3index()) == {614553222213795839, 614553206816505855}


def test_csv_wkb(tmp_path):
    csv_string = """wkb,name
010100000000000000000000000000000000000000,point1
01010000009a9999999999b93f9a9999999999b93f,point2
"""
    csv_path = tmp_path / "test.csv"
    with open(csv_path, "w") as f:
        f.write(csv_string)
    handler = VectorHandler.from_file(csv_path)
    assert set(handler.h3index()) == {614553222213795839, 614553206816505855}

import pytest

from worldex.handlers.vector_handlers import VectorHandler


@pytest.fixture
def gpx_test_file(tmp_path):
    gpx_string = """<?xml version="1.0" encoding="UTF-8"?>
<gpx
  version="1.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.topografix.com/GPX/1/1"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
<wpt lat="0.0" lon="0.0"><ele>0.4</ele><time>2020-01-01T01:01:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>171</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></wpt>
<wpt lat="0.1" lon="0.1"><ele>0.4</ele><time>2020-01-01T01:01:10Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>171</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></wpt>
</gpx>"""
    gpx_path = tmp_path / "test.gpx"
    with open(gpx_path, "w") as f:
        f.write(gpx_string)
    yield gpx_path


def test_gpx_handler(gpx_test_file):
    gpxhandler = VectorHandler.from_file(gpx_test_file)
    assert set(gpxhandler.h3index()) == {"88754e2b3dfffff", "88754e6499fffff"}


def test_gpx_handler_diff_resolution(gpx_test_file):
    gpxhandler = VectorHandler.from_file(gpx_test_file, resolution=15)
    assert set(gpxhandler.h3index()) == {"8f754e2b3d62645", "8f754e64992d6d8"}

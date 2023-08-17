import math
from typing import Iterator, Union

from shapely.geometry.linestring import LineString
from shapely.geometry.multilinestring import MultiLineString

ZOOM_TO_H3_RESOLUTION = {
    5: 1,
    6: 2,
    7: 3,
    8: 3,
    9: 4,
    10: 5,
    11: 6,
    12: 6,
    13: 7,
    14: 8,
    15: 9,
    16: 9,
    17: 10,
    18: 10,
    19: 11,
    20: 11,
    21: 12,
    22: 13,
    23: 14,
    24: 15,
}

H3_RESOLUTION_TO_ZOOM = {v: k for k, v in ZOOM_TO_H3_RESOLUTION.items()}


def get_h3_resolution(zoom: int) -> int:
    zoom = math.floor(zoom)
    return ZOOM_TO_H3_RESOLUTION.get(zoom, 1 if zoom < 5 else 15)


def sequential_deduplication(func: Iterator[str]) -> Iterator[str]:
    """
    Decorator that doesn't permit two consecutive items to be the same
    """

    def inner(*args):
        iterable = func(*args)
        last = None
        while (cell := next(iterable, None)) is not None:
            if cell != last:
                yield cell
            last = cell

    return inner


@sequential_deduplication
def h3polyline(
    line: Union[LineString, MultiLineString], resolution: int
) -> Iterator[str]:
    """
    Iterator yielding H3 cells representing a (multi)line,
    retaining order and self-intersections
    """
    if line.geom_type == "MultiLineString":
        # Recurse after getting component linestrings from the multiline
        for l in map(lambda geom: h3polyline(geom, resolution), line.geoms):
            yield from l
    else:
        coords = zip(line.coords, line.coords[1:])
        while (vertex_pair := next(coords, None)) is not None:
            i, j = vertex_pair
            a = h3.geo_to_h3(*i[::-1], resolution)
            b = h3.geo_to_h3(*j[::-1], resolution)
            yield from h3.h3_line(a, b)  # inclusive of a and b

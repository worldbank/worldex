from typing import Iterator, Union

from shapely.geometry.linestring import LineString
from shapely.geometry.multilinestring import MultiLineString


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

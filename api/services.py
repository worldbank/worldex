import math

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

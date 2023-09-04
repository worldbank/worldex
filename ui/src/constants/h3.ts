/* eslint-disable */
export const ZOOM_H3_RESOLUTION_PAIRS = [
    [2, 1],
    [3, 2],
    [4, 3],
    [6, 4],
    [8, 5],
    [10, 6],
    [11, 7],
    [14, 8],
]

export const MINIMUM_ZOOM = ZOOM_H3_RESOLUTION_PAIRS[0][0];
// @ts-ignore
export const MAXIMUM_ZOOM = ZOOM_H3_RESOLUTION_PAIRS.at(-1)[0];
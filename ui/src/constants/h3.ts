/* eslint-disable */
export const ZOOM_H3_RESOLUTION_PAIRS = [
    [2, 2],
    [3, 3],
    [4, 4],
    [6, 5],
    [8, 6],
    [10, 7],
    [11, 8],
    // [14, 8],
]

export const MINIMUM_ZOOM = ZOOM_H3_RESOLUTION_PAIRS[0][0];
// @ts-ignore
export const MAXIMUM_ZOOM = ZOOM_H3_RESOLUTION_PAIRS.at(-1)[0];

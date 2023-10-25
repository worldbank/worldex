/* eslint-disable */
export const ZOOM_H3_RESOLUTION_PAIRS = [
    [2, 3],
    [3, 4],
    [4, 5],
    [6, 6],
    [8, 7],
    [10, 8],
    // [11, 8],
    // [14, 8],
]

export const MINIMUM_ZOOM = ZOOM_H3_RESOLUTION_PAIRS[0][0];
// @ts-ignore
export const MAXIMUM_ZOOM = ZOOM_H3_RESOLUTION_PAIRS.at(-1)[0];

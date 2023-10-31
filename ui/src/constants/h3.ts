/* eslint-disable */
export const ZOOM_H3_RESOLUTION_PAIRS = [
    [1, 3],
    [3, 4],
    [4, 5],
    [6, 6],
    [8, 7],
    [10, 8],
]

export const MINIMUM_ZOOM = Math.min(ZOOM_H3_RESOLUTION_PAIRS[0][0], 1);
// @ts-ignore
export const MAXIMUM_ZOOM = Math.max(ZOOM_H3_RESOLUTION_PAIRS.at(-1)[0], 16);

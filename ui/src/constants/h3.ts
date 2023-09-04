/* eslint-disable */
export const ZOOM_H3_RESOLUTION_PAIRS = [
    [1, 1],
    [4, 3],
    [6, 4],
    [8, 5],
    [10, 6],
    [11, 7],
    [14, 8],
]

// TODO: rm once H3CellsLayer is deprecated
export const getH3Resolution = (currentZoom: number, offset: number = 2): number => {
    if (currentZoom < 4) return 1;
    const [foundZoom, foundResolution]: [number, number] = (ZOOM_H3_RESOLUTION_PAIRS.find(
        ([z, r]) => (z >= currentZoom + offset),
    ) || ZOOM_H3_RESOLUTION_PAIRS.at(-1)) as [number, number];
    return foundResolution;
};
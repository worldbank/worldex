const ZOOM_H3_RESOLUTION_PAIRS = [
  [5, 1],
  [6, 2],
  [7, 3],
  [8, 3],
  [9, 4],
  [10, 5],
  [11, 6],
  [12, 6],
  [13, 7],
  [14, 8],
  [15, 9],
  [16, 9],
  [17, 10],
  [18, 10],
];

export const ZOOM_TO_H3_RESOLUTION: { [key: number]: number } = ZOOM_H3_RESOLUTION_PAIRS.reduce((obj, [zoom, res]) => {
  // @ts-ignore
  obj[zoom] = res;
  return obj;
}, {});

export const H3_RESOLUTION_TO_ZOOM = ZOOM_H3_RESOLUTION_PAIRS.reduce((obj, [zoom, res]) => {
  // @ts-ignore
  obj[res] = zoom;
  return obj;
}, {});

export const getH3Resolution = (zoom: number): number => (
  ZOOM_TO_H3_RESOLUTION[zoom + 2] ?? (zoom < 4 ? 1 : 15)
);

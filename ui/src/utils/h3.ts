const ZOOM_H3_RESOLUTION_PAIRS = [
  [5, 1],
  [6, 2],
  [7, 3],
  [9, 4],
  [10, 5],
  [11, 6],
  [13, 7],
  [14, 8],
  // [15, 9],
  // [17, 10],
];

export const getH3Resolution = (currentZoom: number, offset: number = 2): number => {
  if (currentZoom < 4) return 1;
  const [foundZoom, foundResolution]: [number, number] = (ZOOM_H3_RESOLUTION_PAIRS.find(
    ([z, r]) => (z >= currentZoom + offset),
  ) || ZOOM_H3_RESOLUTION_PAIRS.at(-1)) as [number, number];
  return foundResolution;
};

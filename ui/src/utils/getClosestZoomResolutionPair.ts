import { ZOOM_H3_RESOLUTION_PAIRS } from 'constants/h3';

const getClosestZoomResolutionPair = (currentZoom: number): [number, number] => {
  for (const [idx, [z]] of ZOOM_H3_RESOLUTION_PAIRS.entries()) {
    if (z === currentZoom) {
      return ZOOM_H3_RESOLUTION_PAIRS[idx];
    } else if (z > currentZoom) {
      return ZOOM_H3_RESOLUTION_PAIRS[idx - 1];
    }
    // eslint-disable-next-line no-else-return
  }
  return ZOOM_H3_RESOLUTION_PAIRS.at(-1);
};

export default getClosestZoomResolutionPair;

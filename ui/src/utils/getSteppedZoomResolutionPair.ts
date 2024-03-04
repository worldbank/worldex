/* eslint-disable no-else-return, no-restricted-syntax */
import { ZOOM_H3_RESOLUTION_PAIRS } from 'constants/h3';

const getSteppedZoomResolutionPair = (currentZoom: number): [number, number] => {
  for (const [idx, [z]] of ZOOM_H3_RESOLUTION_PAIRS.entries()) {
    if (z === currentZoom) {
      return ZOOM_H3_RESOLUTION_PAIRS[idx];
    } else if (z > currentZoom) {
      return ZOOM_H3_RESOLUTION_PAIRS[idx - 1];
    }
  }
  return ZOOM_H3_RESOLUTION_PAIRS.at(-1);
};

export default getSteppedZoomResolutionPair;

import { WebMercatorViewport } from '@deck.gl/core/typed';
import { BoundingBox } from 'components/common/types';

const bboxToViewStateParams = ({ bbox, width, height }: { bbox: BoundingBox, width: number, height: number }) => {
  const {
    minLon, minLat, maxLon, maxLat,
  } = bbox;
  const { latitude, longitude, zoom } = new WebMercatorViewport({ width, height }).fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 50 });
  return { latitude, longitude, zoom: Math.max(zoom, 1) };
};

export default bboxToViewStateParams;

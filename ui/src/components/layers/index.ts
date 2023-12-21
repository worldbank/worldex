import { ZOOM_H3_RESOLUTION_PAIRS } from 'constants/h3';
import DatasetH3Layer from './DatasetH3Layer';
import SearchLayer from './SearchLayer';
import DatasetCountLayer from './DatasetCountLayer';
// [hygen] Import layers

export const getLayers = () => [
  // ...ZOOM_H3_RESOLUTION_PAIRS.map(
  //   ([zoom, res], idx) => DatasetH3Layer(res, zoom, null || ZOOM_H3_RESOLUTION_PAIRS?.[idx + 1]?.[0]),
  // ),
  DatasetCountLayer(),
  SearchLayer(),
  // [hygen] Add layer
];

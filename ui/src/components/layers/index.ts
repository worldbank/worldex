import { getH3Resolution } from 'utils/h3';
import H3CellsLayer from './H3CellsLayer';
import DatasetH3Layer from './DatasetH3Layer';
// [hygen] Import layers

export const getLayers = () => [
  // H3CellsLayer(),
  DatasetH3Layer(1, 1, 3),
  DatasetH3Layer(3, 4, 5),
  DatasetH3Layer(4, 6, 7),
  DatasetH3Layer(5, 8, 9),
  DatasetH3Layer(6, 10, 10),
  DatasetH3Layer(7, 11, 13),
  DatasetH3Layer(8, 14),
  // [hygen] Add layer
];

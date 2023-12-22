import SearchLayer from './SearchLayer';
import DatasetCountLayer from './DatasetCountLayer';
// [hygen] Import layers

export const getLayers = () => [
  DatasetCountLayer(),
  SearchLayer(),
  // [hygen] Add layer
];

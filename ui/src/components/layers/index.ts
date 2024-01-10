import SearchLayer from './SearchLayer';
import DatasetCountLayer from './DatasetCountLayer';
import DatasetCoverageLayer from './DatasetCoverageLayer';
// [hygen] Import layers

export const getLayers = () => [
  DatasetCountLayer(),
  SearchLayer(),
  DatasetCoverageLayer(),
  // [hygen] Add layer
];

import SearchLayer from './SearchLayer';
import DatasetCountLayer from './DatasetCountLayer';
import DatasetCoverageLayer from './DatasetCoverageLayer';
import PreviewLayer from './PreviewLayer';
// [hygen] Import layers

export const getLayers = () => [
  DatasetCountLayer(),
  SearchLayer(),
  DatasetCoverageLayer(),
  PreviewLayer(),
  // [hygen] Add layer
];

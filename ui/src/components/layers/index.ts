import SearchLayer from './SearchLayer';
import DatasetCountLayer from './DatasetCountLayer';
import DatasetCoverageLayer from './DatasetCoverageLayer';
import PreviewLayer from './PreviewLayer';
import TifPreviewLayer from './TifPreviewLayer';
// [hygen] Import layers

export const getLayers = () => [
  DatasetCountLayer(),
  SearchLayer(),
  DatasetCoverageLayer(),
  PreviewLayer(),
  TifPreviewLayer(),
  // [hygen] Add layer
];

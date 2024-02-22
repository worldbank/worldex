import SearchLayer from './SearchLayer';
import DatasetCountLayer from './DatasetCountLayer';
import DatasetCoverageLayer from './DatasetCoverageLayer';
import GeojsonPreviewLayer from './GeojsonPreviewLayer';
import TifPreviewLayer from './TifPreviewLayer';
// [hygen] Import layers

export const getLayers = () => [
  DatasetCountLayer(),
  SearchLayer(),
  DatasetCoverageLayer(),
  GeojsonPreviewLayer(),
  TifPreviewLayer(),
  // [hygen] Add layer
];

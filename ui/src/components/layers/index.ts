import LocationLayer from './LocationLayer';
import DatasetCountLayer from './DatasetCountLayer';
import DatasetCoverageLayer from './DatasetCoverageLayer';
import GeojsonPreviewLayer from './GeojsonPreviewLayer';
import TifPreviewLayer from './TifPreviewLayer';
import SlippyTileLayer from './SlippyTileLayer';
// [hygen] Import layers

export const getLayers = () => [
  DatasetCountLayer(),
  LocationLayer(),
  DatasetCoverageLayer(),
  SlippyTileLayer(),
  GeojsonPreviewLayer(),
  TifPreviewLayer(),
  // [hygen] Add layer
];

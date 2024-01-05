import SearchLayer from './SearchLayer';
import DatasetCountLayer from './DatasetCountLayer';
import SelectedDatasetLayer from './SelectedDatasetLayer';
// [hygen] Import layers

export const getLayers = () => [
  DatasetCountLayer(),
  SearchLayer(),
  SelectedDatasetLayer(),
  // [hygen] Add layer
];

// @ts-ignore
import { MAP_TYPES } from '@deck.gl/carto';

const SELECTED_DATASET_SOURCE_ID = 'selectedDatasetSource';

const source = {
  id: SELECTED_DATASET_SOURCE_ID,
  type: MAP_TYPES.TILESET,
  data: 'api/dataset_coverage/{z}/{x}/{y}',
};

export default source;

// @ts-ignore
import { MAP_TYPES } from '@deck.gl/carto';

const DATASET_COVERAGE_SOURCE_ID = 'datasetCoverageSource';

const source = {
  id: DATASET_COVERAGE_SOURCE_ID,
  type: MAP_TYPES.TILESET,
  data: `${import.meta.env.VITE_API_URL}/dataset_coverage/{z}/{x}/{y}`,
};

export default source;

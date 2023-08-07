// @ts-ignore
import { MAP_TYPES } from '@deck.gl/carto';

const H3_CELLS_SOURCE_ID = 'h3CellsSource';

const source = {
  id: H3_CELLS_SOURCE_ID,
  type: MAP_TYPES.TILESET,
  data: `http://localhost:8000/h3_tiles/{z}/{x}/{y}`,
};

export default source;

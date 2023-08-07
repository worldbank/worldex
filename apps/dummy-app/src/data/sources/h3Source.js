import { MAP_TYPES } from '@deck.gl/carto';

const H3_SOURCE_ID = 'h3Source';

const source = {
  id: H3_SOURCE_ID,
  type: MAP_TYPES.TILESET,
  data: `${process.env.REACT_APP_API_URL}/h3_tiles/{z}/{x}/{y}`,
};

export default source;

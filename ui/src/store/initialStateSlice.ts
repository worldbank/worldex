import { VOYAGER } from '@carto/react-basemaps';
import { InitialCarto3State } from '@carto/react-redux';
// @ts-ignore
import { API_VERSIONS } from '@deck.gl/carto';

export const initialState: InitialCarto3State = {
  viewState: {
    latitude: 31.802892,
    longitude: -103.007813,
    zoom: 2,
    pitch: 0,
    bearing: 0,
    dragRotate: false,
  },
  basemap: VOYAGER,
  credentials: {}, // carto-required but unnecessary
  googleApiKey: '', // only required when using a Google Basemap,
  googleMapId: '', // only required when using a Google Custom Basemap
  accountsUrl: 'http://app.carto.com/',
};

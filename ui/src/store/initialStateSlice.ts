import { POSITRON } from '@carto/react-basemaps';
import { InitialCarto3State } from '@carto/react-redux';

const STAMEN_TONER = {
  type: 'mapbox',
  options: {
    mapStyle: 'https://tiles.stadiamaps.com/styles/stamen_toner_lite.json',
  },
};

export const initialState: InitialCarto3State = {
  viewState: {
    latitude: 0,
    longitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
    dragRotate: false,
    // @ts-ignore
    // transitionDuration: 1000,
    // transitionInterpolator: new FlyToInterpolator(),
    // transitionInterruption: TRANSITION_EVENTS.IGNORE,
  },
  // @ts-ignore
  basemap: (import.meta.env.VITE_USE_STAMEN_TONER) === 'true' ? STAMEN_TONER : POSITRON,
  credentials: {}, // carto-required but unnecessary
  googleApiKey: '', // only required when using a Google Basemap,
  googleMapId: '', // only required when using a Google Custom Basemap
  accountsUrl: 'http://app.carto.com/',
};

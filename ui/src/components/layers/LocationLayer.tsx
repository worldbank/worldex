import { useSelector } from 'react-redux';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import { RootState } from 'store/store';

export const LOCATION_LAYER_ID = 'locationLayer';

export default function LocationLayer() {
  const { locationLayer } = useSelector((state: RootState) => state.carto.layers);
  const { location } = useSelector((state: RootState) => state.search);
  const data = location?.geojson;

  if (locationLayer && data) {
    return new GeoJsonLayer({
      id: LOCATION_LAYER_ID,
      data,
      pickable: true,
      stroked: true,
      filled: false,
      lineWidthMinPixels: 2,
      getLineColor: [241, 109, 122],
    });
  }
}

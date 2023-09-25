import { useSelector } from 'react-redux';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import { RootState } from 'store/store';

export const SEARCH_LAYER_ID = 'searchLayer';

export default function SearchLayer() {
  const { searchLayer } = useSelector((state: RootState) => state.carto.layers);
  const geojson = useSelector((state: RootState) => state.location.response?.geojson);

  if (searchLayer && geojson) {
    return new GeoJsonLayer({
      id: SEARCH_LAYER_ID,
      data: geojson,
      pickable: true,
      stroked: true,
      filled: false,
      lineWidthMinPixels: 2,
      getLineColor: [241, 109, 122],
    });
  }
}
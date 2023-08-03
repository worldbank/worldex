import { useSelector } from 'react-redux';
import { CartoLayer } from '@deck.gl/carto';
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { useCartoLayerProps } from '@carto/react-api';
import htmlForFeature from 'utils/htmlForFeature';

export const H3_LAYER_ID = 'h3Layer';

export default function H3Layer() {
  const { h3Layer } = useSelector((state) => state.carto.layers);
  const source = useSelector((state) => selectSourceById(state, h3Layer?.source));
  const cartoLayerProps = useCartoLayerProps({ source });
  const data = [
    "814e7ffffffffff",
    "814afffffffffff",
    "81737ffffffffff"
  ]
  console.log("checking whether to return h3 hexagon layer")
  if (h3Layer && source) {
    console.log("returning h3 hexagon layer", source)
    
    return new TileLayer({
      id: 'h3-layer',
      data: `http://localhost:8000${source.data}`,
      renderSubLayers: props => {
        return new H3HexagonLayer(props, {
          getHexagon: (d) => {
            console.log(d);
            return d;
          },
          pickable: true,
          stroked: true,
          lineWidthMinPixels: 1,
          getLineColor: [255, 210, 0],
          filled: false,
          getLineWidth: 2,
          extruded: false,
        })
      }
    })
  }
}

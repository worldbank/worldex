import { useSelector } from 'react-redux';
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { Box, Typography } from '@mui/material';
import htmlForFeature from 'utils/htmlForFeature';
import { renderToStaticMarkup } from 'react-dom/server';

export const H3_LAYER_ID = 'h3Layer';

export default function H3Layer() {
  const { h3Layer } = useSelector((state) => state.carto.layers);
  const source = useSelector((state) => selectSourceById(state, h3Layer?.source));
  if (h3Layer && source) {
    
    return new TileLayer({
      id: 'h3-layer',
      data: source.data,
      onHover: (info) => {
        if (info?.object) {
          if (info?.object?.index) {
            info.object = {
              html: renderToStaticMarkup(
                <Typography>Cell ID: {info.object.index}</Typography>
              ),
              style: {}
            }
          }
        }
      },
      renderSubLayers: props => new H3HexagonLayer(props, {
        getHexagon: d => d.index,
        pickable: true,
        stroked: true,
        lineWidthMinPixels: 1,
        getLineColor: [255, 210, 0],
        getFillColor: [255, 255, 255, 0],
        filled: true,
        getLineWidth: 2,
        extruded: false,
      })
    })
  }
}

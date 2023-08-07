import { useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { RootState } from 'store/store';
import { Typography } from '@mui/material';
import { renderToStaticMarkup } from 'react-dom/server';

export const H3_CELLS_LAYER_ID = 'h3CellsLayer';

export default function H3CellsLayer() {
  const { h3CellsLayer } = useSelector((state: RootState) => state.carto.layers);
  const source = useSelector((state) =>
    selectSourceById(state, h3CellsLayer?.source),
  );

  if (h3CellsLayer && source) {
    return new TileLayer({
      id: 'h3-layer',
      data: source.data,
      onHover: (info: any) => {
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
      renderSubLayers: (props: any) => new H3HexagonLayer(props, {
        getHexagon: (d: any) => d.index,
        pickable: true,
        stroked: true,
        lineWidthMinPixels: 1,
        getLineColor: [255, 210, 0],
        getFillColor: [255, 255, 255, 0],
        filled: true,
        getLineWidth: 2,
        extruded: false,
      })
    });
  }
}

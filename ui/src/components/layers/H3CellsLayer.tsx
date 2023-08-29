import { useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { RootState } from 'store/store';
import { Typography } from '@mui/material';
import { renderToStaticMarkup } from 'react-dom/server';
import { getH3Resolution } from 'utils/h3';

export const H3_CELLS_LAYER_ID = 'h3CellsLayer';

// TODO: explore if it's possile to override {z} in url with
// h3 resolution to minimize api calls between zooms
export default function H3CellsLayer() {
  const { h3CellsLayer } = useSelector((state: RootState) => state.carto.layers);
  const source = useSelector((state) => selectSourceById(state, h3CellsLayer?.source));
  // viewstate zoom is not always in sync with the tile.index.z supplied to getTileData
  const resolution = useSelector((state: RootState) => getH3Resolution(Math.floor(state.carto.viewState.zoom)));
  if (h3CellsLayer && source) {
    return new TileLayer({
      id: 'h3-layer',
      data: source.data,
      loadOptions: {
        fetch: {
          method: 'POST',
          body: JSON.stringify({ resolution }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      },
      onHover: (info: any) => {
        if (info?.object) {
          if (info?.object?.index) {
            info.object = {
              html: renderToStaticMarkup(
                <>
                  <Typography>
                    Cell ID:
                    {info.object.index}
                  </Typography>
                  <Typography>
                    Dataset Count:
                    {info.object.dataset_count}
                  </Typography>
                </>,
              ),
              style: {},
            };
          }
        }
      },
      renderSubLayers: (props: any) => new H3HexagonLayer(props, {
        getHexagon: (d: any) => d.index,
        pickable: true,
        stroked: true,
        lineWidthMinPixels: 1,
        getLineColor: [255, 210, 0],
        getFillColor: (d: any) => [255, 210, 0, d.dataset_count > 0 ? 100 : 0],
        filled: true,
        getLineWidth: 2,
        extruded: false,
      }),
      updateTriggers: {
        getTileData: [resolution],
      },
    });
  }
}

import { useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { RootState } from 'store/store';
import { Typography } from '@mui/material';
import { renderToStaticMarkup } from 'react-dom/server';

export const DATASET_H3_LAYER_ID_PREFIX = 'datasetH3Layer';

export default function DatasetH3Layer(resolution: number, minZoom: number, maxZoom?: number) {
  const datasetH3Layer = useSelector((state: RootState) => state.carto.layers[`${DATASET_H3_LAYER_ID_PREFIX}${resolution}r`]);
  const source = useSelector((state) => selectSourceById(state, datasetH3Layer?.source));

  const zoom = useSelector(((state: RootState) => Math.floor(state.carto.viewState.zoom)));
  if (datasetH3Layer && source) {
    return new TileLayer({
      id: `dataset-h3-tile-layer-${resolution}`,
      data: source.data,
      minZoom,
      maxZoom: minZoom,
      visible: (zoom >= minZoom) && (maxZoom ? zoom < maxZoom : true),
      loadOptions: {
        fetch: {
          method: 'POST',
          body: JSON.stringify({
            resolution,
            should_count: resolution >= 5,
          }),
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
                  {
                    info.object?.dataset_count
                    && (
                      <Typography>
                        Dataset Count:
                        {info.object.dataset_count}
                      </Typography>
                    )
                  }
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
        getFillColor: (d: any) => [255, 210, 0, 100],
        filled: true,
        getLineWidth: 2,
        extruded: false,
      }),
      updateTriggers: {
        visible: [zoom],
      },
    });
  }
}

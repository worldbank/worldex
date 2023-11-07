import { useDispatch, useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { RootState } from 'store/store';
import { Typography } from '@mui/material';
import { renderToStaticMarkup } from 'react-dom/server';
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';

export const DATASET_H3_LAYER_ID_PREFIX = 'datasetH3Layer';

export default function DatasetH3Layer(resolution: number, minZoom: number, maxZoom?: number) {
  const datasetH3Layer = useSelector((state: RootState) => state.carto.layers[`${DATASET_H3_LAYER_ID_PREFIX}${resolution}r`]);
  const source = useSelector((state) => selectSourceById(state, datasetH3Layer?.source));
  const selectedH3Index = useSelector((state: RootState) => state.selected.h3Index);
  const dispatch = useDispatch();

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
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      },
      onClick: async (info: any, event: any) => {
        const targetIndex = info.object.index;
        if (selectedH3Index === targetIndex) {
          dispatch(setSelectedH3Index(null));
          dispatch(setDatasets(null));
          return;
        }
        dispatch(setSelectedH3Index(targetIndex));
        const resp = await fetch(`/api/h3_tile/${targetIndex}`, {
          method: 'post',
        });
        const results = await resp.json();
        dispatch(setDatasets(results));
      },
      onHover: (info: any) => {
        if (info?.object) {
          if (info?.object?.index) {
            info.object = {
              html: renderToStaticMarkup(
                <>
                  <Typography>
                    Cell ID:
                    {' '}
                    {info.object.index}
                  </Typography>
                  {
                    info.object?.dataset_count
                    && (
                      <Typography>
                        Dataset Count:
                        {' '}
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
        getLineColor: (d: any) => (d.index === selectedH3Index ? [255, 0, 0] : [255, 210, 0]),
        getFillColor: (d: any) => {
          const opacity = Math.max(40, 220 * Math.min(d.dataset_count / 30, 1));
          const rgb: [number, number, number] = d.index === selectedH3Index ? [255, 0, 0] : [255, 210, 0];
          return [...rgb, opacity];
        },
        filled: true,
        getLineWidth: 2,
        extruded: false,
      }),
      updateTriggers: {
        getLineColor: [selectedH3Index],
        getFillColor: [selectedH3Index],
        visible: [zoom],
      },
    });
  }
}

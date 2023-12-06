import { OR_YEL } from 'constants/colors';
import { useDispatch, useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { RootState } from 'store/store';
import { Typography } from '@mui/material';
import { renderToStaticMarkup } from 'react-dom/server';
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { colorBins, hexToRgb } from 'utils/colors';
import { DatasetCount } from 'components/common/types';

export const DATASET_H3_LAYER_ID_PREFIX = 'datasetH3Layer';

export default function DatasetH3Layer(resolution: number, minZoom: number, maxZoom?: number) {
  const datasetH3Layer = useSelector((state: RootState) => state.carto.layers[`${DATASET_H3_LAYER_ID_PREFIX}${resolution}r`]);
  const source = useSelector((state) => selectSourceById(state, datasetH3Layer?.source));
  const selectedH3Index = useSelector((state: RootState) => state.selected.h3Index);
  const dispatch = useDispatch();

  const domains = (import.meta.env.VITE_DATASET_COUNT_BINS).split(',').map(Number);
  const getColor = colorBins({
    attr: 'dataset_count',
    domains,
    colors: OR_YEL.map(hexToRgb),
  });

  const zoom = useSelector(((state: RootState) => state.carto.viewState.zoom));
  const isVisible = (zoom >= minZoom) && (maxZoom ? zoom < maxZoom : true);
  if (datasetH3Layer && source && isVisible) {
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
        getHexagon: (d: DatasetCount) => d.index,
        pickable: true,
        stroked: true,
        lineWidthMinPixels: 1,
        // @ts-ignore
        getLineColor: (d: DatasetCount) => [...getColor(d), 160],
        // @ts-ignore
        getFillColor: (d: DatasetCount) => [...getColor(d), 200],
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

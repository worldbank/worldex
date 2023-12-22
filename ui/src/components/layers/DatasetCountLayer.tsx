import { OR_YEL, SELECTED_OUTLINE } from 'constants/colors';
import { ZOOM_H3_RESOLUTION_PAIRS } from 'constants/h3';
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
import { setH3Resolution } from 'store/appSlice';

export const DATASET_COUNT_LAYER_ID = 'datasetCountLayer';

export default function DatasetCountLayer() {
  const datasetH3Layer = useSelector((state: RootState) => state.carto.layers[DATASET_COUNT_LAYER_ID]);
  const source = useSelector((state) => selectSourceById(state, datasetH3Layer?.source));
  const selectedH3Index = useSelector((state: RootState) => state.selected.h3Index);
  const dispatch = useDispatch();

  const domains = (import.meta.env.VITE_DATASET_COUNT_BINS).split(',').map(Number);
  const getColor = colorBins({
    attr: 'dataset_count',
    domains,
    colors: OR_YEL.map(hexToRgb),
  });

  const currentZoom = useSelector(((state: RootState) => state.carto.viewState.zoom));
  // TODO: convert to a functional call
  const [closestZoom, resolution] = (() => {
    for (const [idx, [zoom, _]] of ZOOM_H3_RESOLUTION_PAIRS.entries()) {
      if (zoom === currentZoom) {
        return ZOOM_H3_RESOLUTION_PAIRS[idx];
      } else if (zoom > currentZoom) {
        return ZOOM_H3_RESOLUTION_PAIRS[idx - 1];
      }
    }
    return ZOOM_H3_RESOLUTION_PAIRS.at(-1);
  })();
  dispatch(setH3Resolution(resolution));
  if (datasetH3Layer && source) {
    return new TileLayer({
      id: 'dataset-h3-tile-layer',
      data: source.data,
      maxZoom: closestZoom,
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
        getLineColor: (d: DatasetCount) => (d.index === selectedH3Index ? [...SELECTED_OUTLINE, 255] : [...getColor(d), 160]),
        // @ts-ignore
        getFillColor: (d: DatasetCount) => [...getColor(d), 200],
        filled: true,
        getLineWidth: (d: DatasetCount) => (d.index === selectedH3Index ? 3 : 2),
        extruded: false,
      }),
      updateTriggers: {
        minZoom: [closestZoom],
        maxZoom: [closestZoom],
        getLineColor: [selectedH3Index],
        getFillColor: [selectedH3Index],
        getLineWidth: [selectedH3Index],
      },
    });
  }
}

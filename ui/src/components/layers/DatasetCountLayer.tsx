import { OR_YEL, SELECTED_OUTLINE } from 'constants/colors';
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

export const DATASET_COUNT_LAYER_ID = 'datasetCountLayer';

export default function DatasetCountLayer() {
  const datasetH3Layer = useSelector((state: RootState) => state.carto.layers[DATASET_COUNT_LAYER_ID]);
  const source = useSelector((state: RootState) => selectSourceById(state, datasetH3Layer?.source));
  const { selectedDataset, h3Index: selectedH3Index } = useSelector((state: RootState) => state.selected);
  const { h3Resolution: resolution, closestZoom } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  const domains = (import.meta.env.VITE_DATASET_COUNT_BINS).split(',').map(Number);
  const getColor = colorBins({
    attr: 'dataset_count',
    domains,
    colors: OR_YEL.map(hexToRgb),
  });

  if (datasetH3Layer && source) {
    return new TileLayer({
      id: 'dataset-h3-tile-layer',
      data: source.data,
      maxZoom: closestZoom,
      // refinementStrategy: 'no-overlap',
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
        getLineColor: (d: DatasetCount) => (d.index === selectedH3Index ? [...SELECTED_OUTLINE, 255] : [...getColor(d), selectedDataset ? 12 : 160]),
        // @ts-ignore
        getFillColor: (d: DatasetCount) => [...getColor(d), selectedDataset ? 60 : 200],
        filled: true,
        getLineWidth: (d: DatasetCount) => {
          if (selectedDataset) {
            return 1;
          }
          return d.index === selectedH3Index ? 3 : 2;
        },
        extruded: false,
      }),
      updateTriggers: {
        minZoom: [closestZoom],
        maxZoom: [closestZoom],
        getLineColor: [selectedH3Index, selectedDataset],
        getFillColor: [selectedH3Index, selectedDataset],
        getLineWidth: [selectedH3Index, selectedDataset],
      },
    });
  }
}

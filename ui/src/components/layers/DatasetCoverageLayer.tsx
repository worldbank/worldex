import { blue } from '@mui/material/colors';
import { useDispatch, useSelector } from 'react-redux';
// @ts-ignore
import { selectSourceById } from '@carto/react-redux';
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers/typed';
import { RootState } from 'store/store';
import { hexToRgb } from 'utils/colors';
import { setSelectedDataset } from 'store/selectedSlice';
import { setPendingLocationCheck } from 'store/locationSlice';

export const DATASET_COVERAGE_LAYER_ID = 'datasetCoverageLayer';

export default function DatasetCoverageLayer() {
  const { datasetCoverageLayer } = useSelector((state: RootState) => state.carto.layers);
  const source = useSelector((state) => selectSourceById(state, datasetCoverageLayer?.source));
  const { selectedDataset } = useSelector((state: RootState) => state.selected);
  const { h3Resolution: resolution, closestZoom } = useSelector((state: RootState) => state.app);
  const { location, pendingLocationCheck } = useSelector((state: RootState) => state.location);
  const BLUE_600 = hexToRgb(blue['600']); // #1e88e5
  const dispatch = useDispatch();

  if (selectedDataset && datasetCoverageLayer && source) {
    // @ts-ignore
    return new TileLayer({
      // assigning a unique layer id will ensure cached tiles
      // between different datasets/locations are segregated
      id: (
        location && location.place_id
          ? `dataset-${selectedDataset}-${location.place_id}-tile-layer`
          : `dataset-${selectedDataset}-coverage-tile-layer`
      ),
      data: source.data,
      maxZoom: closestZoom,
      loadOptions: {
        fetch: {
          method: 'POST',
          body: JSON.stringify({
            resolution,
            dataset_id: selectedDataset,
            location: (
              location && ['Polygon', 'MultiPolygon'].includes(location.geojson.type)
                ? JSON.stringify(location.geojson)
                : null
            ),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      },
      refinementStrategy: 'never',
      onViewportLoad: (data) => {
        if (pendingLocationCheck && data.every((tile) => tile.content.length === 0)) {
          // if location search result filters out all tiles of
          // the selected dataset, then deselect the dataset
          dispatch(setSelectedDataset(null));
          dispatch(setPendingLocationCheck(false));
        }
      },
      renderSubLayers: (props: object) => new H3HexagonLayer(props, {
        getHexagon: (d: string) => d,
        stroked: true,
        lineWidthMinPixels: 1,
        getLineColor: [...BLUE_600, 120],
        getFillColor: [...BLUE_600, 160],
        filled: true,
        extruded: false,
      }),
      updateTriggers: {
        id: [selectedDataset, location?.place_id],
        minZoom: [closestZoom],
        maxZoom: [closestZoom],
      },
    });
  }
}

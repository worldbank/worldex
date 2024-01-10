import { blue } from '@mui/material/colors';
import { useSelector } from 'react-redux';
// @ts-ignore
import { selectSourceById } from '@carto/react-redux';
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers/typed';
import { RootState } from 'store/store';
import { hexToRgb } from 'utils/colors';

export const DATASET_COVERAGE_LAYER_ID = 'datasetCoverageLayer';

export default function DatasetCoverageLayer() {
  const { datasetCoverageLayer } = useSelector((state: RootState) => state.carto.layers);
  const source = useSelector((state) => selectSourceById(state, datasetCoverageLayer?.source));
  const { selectedDataset } = useSelector((state: RootState) => state.selected);
  const { h3Resolution: resolution, closestZoom } = useSelector((state: RootState) => state.app);
  const BLUE_600 = hexToRgb(blue['600']); // #1e88e5

  if (selectedDataset && datasetCoverageLayer && source) {
    return new TileLayer({
      id: `dataset-${selectedDataset}-coverage-tile-layer`,
      data: source.data,
      maxZoom: closestZoom,
      loadOptions: {
        fetch: {
          method: 'POST',
          body: JSON.stringify({
            resolution,
            dataset_id: selectedDataset,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      },
      refinementStrategy: 'never',
      renderSubLayers: (props: any) => new H3HexagonLayer(props, {
        getHexagon: (d: any) => d.index,
        stroked: true,
        lineWidthMinPixels: 1,
        getLineColor: [...BLUE_600, 120],
        getFillColor: [...BLUE_600, 160],
        filled: true,
        extruded: false,
      }),
      updateTriggers: {
        minZoom: [closestZoom],
        maxZoom: [closestZoom],
      },
    });
  }
}

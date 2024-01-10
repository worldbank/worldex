import { ZOOM_H3_RESOLUTION_PAIRS } from 'constants/h3';
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
  const currentZoom = useSelector(((state: RootState) => state.carto.viewState.zoom));
  // TODO: decouple this computation from layer code and make it reusable
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

  const color = hexToRgb('1e88e5');

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
        getLineColor: [...color, 120],
        getFillColor: [...color, 160],
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

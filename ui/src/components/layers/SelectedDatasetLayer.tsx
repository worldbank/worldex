import { SELECTED_OUTLINE } from 'constants/colors';
import { ZOOM_H3_RESOLUTION_PAIRS } from 'constants/h3';
import { useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { RootState } from 'store/store';

export const SELECTED_DATASET_LAYER_ID = 'selectedDatasetLayer';

export default function SelectedDatasetLayer() {
  const { selectedDatasetLayer } = useSelector((state: RootState) => state.carto.layers);
  const source = useSelector((state) => selectSourceById(state, selectedDatasetLayer?.source));

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

  if (selectedDataset && selectedDatasetLayer && source) {
    return new TileLayer({
      id: `dataset-${selectedDataset}-tile-layer`,
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
        getLineColor: SELECTED_OUTLINE,
        filled: false,
        extruded: false,
      }),
      updateTriggers: {
        minZoom: [closestZoom],
        maxZoom: [closestZoom],
      },
    });
  }
}

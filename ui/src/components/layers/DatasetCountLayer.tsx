import { OR_YEL, SELECTED_OUTLINE } from 'constants/colors';
import { colorBins, hexToRgb } from 'utils/colors';
import { selectSourceById } from '@carto/react-redux';
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers/typed';
import { Tile2DHeader, TileLoadProps } from '@deck.gl/geo-layers/typed/tileset-2d';
import { ArrowLoader } from '@loaders.gl/arrow';
import { load } from '@loaders.gl/core';
import { Typography } from '@mui/material';
import { Dataset, DatasetCount } from 'components/common/types';
import { renderToStaticMarkup } from 'react-dom/server';
import { useDispatch, useSelector } from 'react-redux';
import { selectAccessibilities, selectSourceOrgFilters } from 'store/selectedFiltersSlice';
import { resetByKey as resetSelectedByKeys, selectDatasetIds, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from 'store/store';
import getSteppedZoomResolutionPair from 'utils/getSteppedZoomResolutionPair';
import {
  TILE_STATE_VISIBLE,
  TILE_STATE_VISITED,
  getPlaceholderInAncestors,
  getPlaceholderInChildren,
} from 'utils/tileRefinement';
import splitIntoDomains from 'utils/splitIntoBins';

export const DATASET_COUNT_LAYER_ID = 'datasetCountLayer';

const refinementStrategy = (allTiles: Tile2DHeader[]) => {
  const selectedTiles = allTiles.filter((tile) => tile.isSelected);
  // get minmax of x, y coordinates in one pass
  const {
    minX, maxX, minY, maxY,
  } = selectedTiles.reduce((acc, val) => ({
    minX: acc.minX === null || val.index.x < acc.minX ? val.index.x : acc.minX,
    maxX: acc.maxX === null || val.index.x > acc.maxX ? val.index.x : acc.maxX,
    minY: acc.minY === null || val.index.y < acc.minY ? val.index.y : acc.minY,
    maxY: acc.maxY == null || val.index.y > acc.maxY ? val.index.y : acc.maxY,
  }), {
    minX: null, maxX: null, minY: null, maxY: null,
  });

  const centerTiles = selectedTiles.filter((tile) => {
    if ((maxX - minX > 1) && [maxX, minX].includes(tile.index.x)) {
      return false;
    }
    if ((maxY - minY > 1) && [maxY, minY].includes(tile.index.y)) {
      return false;
    }
    return true;
  });

  if (centerTiles.some((tile) => tile.isVisible && tile.isLoaded && tile.content)) {
    // do not display cached tiles (of a different resolution) if
    // at least one tile of the correct resolution is already visible
    return;
  }

  // copy of 'no-overlap' strategy from
  // https://github.com/visgl/deck.gl/blob/master/modules/geo-layers/src/tileset-2d/tileset-2d.ts
  for (const tile of allTiles) {
    tile.state = 0;
  }
  for (const tile of allTiles) {
    if (tile.isSelected) {
      getPlaceholderInAncestors(tile);
    }
  }
  // Always process parents first
  const sortedTiles = Array.from(allTiles).sort((t1, t2) => t1.zoom - t2.zoom);
  for (const tile of sortedTiles) {
    tile.isVisible = Boolean(tile.state! & TILE_STATE_VISIBLE);

    if (tile.children && (tile.isVisible || tile.state! & TILE_STATE_VISITED)) {
      for (const child of tile.children) {
        // If the tile is rendered, or if the tile has been explicitly hidden, hide all of its children
        child.state = TILE_STATE_VISITED;
      }
    } else if (tile.isSelected) {
      getPlaceholderInChildren(tile);
    }
  }
};

export default function DatasetCountLayer() {
  const datasetH3Layer = useSelector((state: RootState) => state.carto.layers[DATASET_COUNT_LAYER_ID]);
  const source = useSelector((state: RootState) => selectSourceById(state, datasetH3Layer?.source));
  const { selectedDataset, h3Index: selectedH3Index, datasets }: { selectedDataset: Dataset, h3Index: string, datasets: Dataset[] } = useSelector((state: RootState) => state.selected);
  const { steppedZoom }: { steppedZoom: number } = useSelector((state: RootState) => state.app);
  const { location }: { location: any } = useSelector((state: RootState) => state.search);
  const { fileUrl } = useSelector((state: RootState) => state.preview);
  const dispatch = useDispatch();
  const sourceOrgs = useSelector(selectSourceOrgFilters);
  const accessibilities = useSelector(selectAccessibilities);
  const datasetIds = useSelector(selectDatasetIds);

  const default_bins = (import.meta.env.VITE_DATASET_COUNT_BINS).split(',').map(Number);
  const domains = Array.isArray(datasets) && datasets.length > 0 ? splitIntoDomains(datasets.length) : default_bins;
  const getColor = colorBins({
    attr: 'dataset_count',
    domains,
    colors: OR_YEL.map(hexToRgb),
  });

  const shouldDim = selectedDataset || !!fileUrl;

  if (datasetH3Layer && source) {
    return new TileLayer({
      // assigning a unique layer id will ensure cached tiles
      // between different locations are segregated
      id: (
        location && location.place_id
          ? `dataset-count-${location.place_id}-tile-layer`
          : 'dataset-h3-tile-layer'
      ),
      data: source.data,
      // @ts-ignore
      getTileData: ((tile: TileLoadProps) => load(
        tile.url,
        ArrowLoader,
        {
          arrow: {
            shape: 'object-row-table',
          },
          fetch: {
            method: 'POST',
            body: JSON.stringify({
              resolution: getSteppedZoomResolutionPair(tile.index.z)[1],
              location: (
                location && ['Polygon', 'MultiPolygon'].includes(location.geojson.type)
                  ? JSON.stringify(location.geojson)
                  : null
              ),
              dataset_ids: datasetIds,
              source_org: sourceOrgs,
              accessibility: accessibilities,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          },
        },
      )),
      maxZoom: steppedZoom,
      // @ts-ignore
      refinementStrategy,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      onClick: async (info: any, event: object) => {
        const targetIndex = info.object.index;
        if (selectedH3Index === targetIndex) {
          dispatch(resetSelectedByKeys('h3Index'));
          return;
        }
        dispatch(setSelectedH3Index(targetIndex));
      },
      onHover: (info: any) => {
        if (info?.object) {
          if (info?.object?.index) {
            // eslint-disable-next-line no-param-reassign
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
      renderSubLayers: (props: any) => new H3HexagonLayer(
        { ...props, data: props.data.data },
        {
          getHexagon: ((d: DatasetCount) => d.index),
          pickable: true,
          stroked: true,
          lineWidthMinPixels: 1,
          // @ts-ignore
          getLineColor: (d: DatasetCount) => (
            d.index === selectedH3Index
              ? [...SELECTED_OUTLINE, 255]
              : [...getColor(d), shouldDim ? 12 : 160]
          ),
          // @ts-ignore
          getFillColor: (d: DatasetCount) => [...getColor(d), shouldDim ? 60 : 200],
          filled: true,
          getLineWidth: (d: DatasetCount) => {
            if (selectedDataset) {
              return 1;
            }
            return d.index === selectedH3Index ? 3 : 2;
          },
          extruded: false,
        },
      ),
      updateTriggers: {
        // TODO: create a separate location-filtered layer?
        id: [selectedDataset?.id, location?.place_id],
        getLineColor: [selectedH3Index, shouldDim],
        getFillColor: [selectedH3Index, shouldDim],
        getLineWidth: [selectedH3Index, shouldDim],
        getTileData: [sourceOrgs, accessibilities, datasetIds],
      },
    });
  }
}

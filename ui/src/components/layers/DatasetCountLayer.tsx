import { OR_YEL, SELECTED_OUTLINE } from 'constants/colors';
import { useDispatch, useSelector } from 'react-redux';
import { selectSourceById } from '@carto/react-redux';
// @ts-ignore
import { H3HexagonLayer, Tile2DHeader, TileLayer } from '@deck.gl/geo-layers';
import { PolygonLayer, TextLayer } from '@deck.gl/layers/typed';
import { Typography } from '@mui/material';
import { DatasetCount } from 'components/common/types';
import { renderToStaticMarkup } from 'react-dom/server';
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from 'store/store';
import { colorBins, hexToRgb } from 'utils/colors';
import getClosestZoomResolutionPair from 'utils/getClosestZoomResolutionPair';
import groupBy from 'utils/groupBy';
import {
  TILE_STATE_VISIBLE,
  TILE_STATE_VISITED,
  getPlaceholderInAncestors,
  getPlaceholderInChildren,
} from 'utils/tileRefinement';

export const DATASET_COUNT_LAYER_ID = 'datasetCountLayer';

export default function DatasetCountLayer() {
  const datasetH3Layer = useSelector((state: RootState) => state.carto.layers[DATASET_COUNT_LAYER_ID]);
  const source = useSelector((state: RootState) => selectSourceById(state, datasetH3Layer?.source));
  const { selectedDataset, h3Index: selectedH3Index } = useSelector((state: RootState) => state.selected);
  const { h3Resolution: resolution, closestZoom } = useSelector((state: RootState) => state.app);
  const { location } = useSelector((state: RootState) => state.location);
  const { fileUrl } = useSelector((state: RootState) => state.preview);
  const dispatch = useDispatch();

  const domains = (import.meta.env.VITE_DATASET_COUNT_BINS).split(',').map(Number);
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
      maxZoom: closestZoom,
      refinementStrategy: (allTiles: Tile2DHeader[]) => {
        const selectedTiles = allTiles.filter((tile) => tile.isSelected);
        const nonSelectedTiles = allTiles.filter((tile) => !tile.isSelected);
        const xs = selectedTiles.map((tile) => tile.index.x);
        const ys = selectedTiles.map((tile) => tile.index.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const centerTiles = selectedTiles.filter((tile) => {
          if ((maxX - minX > 1) && [maxX, minX].includes(tile.index.x)) {
            return false;
          }
          if ((maxY - minY > 1) && [maxY, minY].includes(tile.index.y)) {
            return false;
          }
          return true;
        });

        console.log(
          'center tiles\n',
          centerTiles.map((tile) => `${tile.index.z}, ${tile.index.x}, ${tile.index.y}`).join('\n'),
          '\nselected tiles\n',
          selectedTiles.map((tile) => `${tile.index.z}, ${tile.index.x}, ${tile.index.y}`).join('\n'),
          '\nnon-selected tiles\n',
          nonSelectedTiles.map((tile) => `${tile.index.z}, ${tile.index.x}, ${tile.index.y}`).join('\n'),
        );

        if (centerTiles.some((tile) => tile.isVisible && tile.isLoaded && tile.content)) {
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
      },
      loadOptions: {
        fetch: {
          method: 'POST',
          body: JSON.stringify({
            resolution,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onClick: async (info: any, event: object) => {
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
      renderSubLayers: (props: any) => {
        const countLayer = new H3HexagonLayer(
          props,
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
        );
        if ((import.meta.env.VITE_OSM_TILE_DEBUG_OVERLAY) !== 'true') {
          return countLayer;
        }
        const slippyLayer = new PolygonLayer(props, {
          id: `${props.id}-bounds`,
          // dummy data otherwise the layer doesn't render
          data: [{}],
          pickable: false,
          stroked: true,
          filled: false,
          getPolygon: (object) => {
            const [[w, s], [e, n]] = props.tile.boundingBox;
            const polygon = [[
              [w, s],
              [e, s],
              [e, n],
              [w, n],
              [w, s],
            ]];
            return polygon;
          },
          getLineColor: [255, 255, 102],
          getLineWidth: 1,
          lineWidthMinPixels: 2,
        });
        const zxyLabelLayer = new TextLayer({
          id: `${props.id}-text`,
          // dummy data otherwise the layer doesn't render
          data: [{}],
          getPosition: (object) => {
            const [[w, s], [e, n]] = props.tile.boundingBox;
            return [(w + e) / 2, (s + n) / 2];
          },
          getText: (object) => {
            const { z, x, y } = props.tile.index;
            return `z:${z} x:${x} y:${y}\nres: ${getClosestZoomResolutionPair(z)[1]}`;
          },
          getSize: 16,
          getAngle: 0,
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'center',
        });
        return [
          countLayer,
          slippyLayer,
          zxyLabelLayer,
        ];
      },
      updateTriggers: {
        id: [selectedDataset, location?.place_id],
        minZoom: [closestZoom],
        maxZoom: [closestZoom],
        getLineColor: [selectedH3Index, shouldDim],
        getFillColor: [selectedH3Index, shouldDim],
        getLineWidth: [selectedH3Index, shouldDim],
      },
    });
  }
}

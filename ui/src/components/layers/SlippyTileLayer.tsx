import { useDispatch, useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, Tile2DHeader } from '@deck.gl/geo-layers';
import { RootState } from 'store/store';
import { PolygonLayer, TextLayer } from '@deck.gl/layers/typed';
import getClosestZoomResolutionPair from 'utils/getClosestZoomResolutionPair';
import { setClosestZoom, setH3Resolution, setZIndex } from 'store/appSlice';

export const SLIPPY_TILE_LAYER_ID = 'slippyTileLayer';

const hide = (import.meta.env.VITE_OSM_TILE_DEBUG_OVERLAY !== 'true');

export default function SlippyTileLayer() {
  const { slippyTileLayer } = useSelector((state: RootState) => state.carto.layers);
  const { zoom } = useSelector((state: RootState) => state.carto.viewState);
  const { closestZoom, h3Resolution } = useSelector((state: RootState) => state.app);

  const dispatch = useDispatch();

  if (slippyTileLayer) {
    return new TileLayer({
      id: SLIPPY_TILE_LAYER_ID,
      data: null,
      pickable: false,
      minZoom: closestZoom,
      maxZoom: closestZoom,
      onViewportLoad: (tiles: Tile2DHeader[]) => {
        if (Array.isArray(tiles) && tiles.length > 0) {
          const { z } = tiles[0].index;
          const [closestZ, res] = getClosestZoomResolutionPair(z);
          if (res !== h3Resolution) {
            dispatch(setZIndex(closestZ));
            dispatch(setH3Resolution(res));
          }
        }
      },
      // @ts-ignore
      renderSubLayers: (props: any) => (hide ? null : [
        new PolygonLayer(props, {
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
          getLineWidth: 2,
          lineWidthMinPixels: 2,
        }),
        new TextLayer({
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
        }),
      ]),
    });
  }
}

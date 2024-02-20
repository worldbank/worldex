import { useSelector } from 'react-redux';
// @ts-ignore
import { TileLayer, Tile2DHeader, H3HexagonLayer } from '@deck.gl/geo-layers';
import { selectSourceById } from '@carto/react-redux';
import { useCartoLayerProps } from '@carto/react-api';
import htmlForFeature from 'utils/htmlForFeature';
import { RootState } from 'store/store';
import { PolygonLayer, TextLayer } from '@deck.gl/layers/typed';

export const SLIPPY_TILE_LAYER_ID = 'slippyTileLayer';

export default function SlippyTileLayer() {
  const { slippyTileLayer } = useSelector((state: RootState) => state.carto.layers);
  // const source = useSelector((state) => selectSourceById(state, slippyTileLayer?.source));
  // const cartoLayerProps = useCartoLayerProps({ source });

  if (slippyTileLayer) {
    const data = [
      {
        // Simple polygon (array of coords)
        contour: [[-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7], [-122.4, 37.7]],
        zipcode: 94107,
        population: 26599,
        area: 6.11,
      },
      {
        // Complex polygon with holes (array of rings)
        contour: [
          [[-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7], [-122.4, 37.7]],
          [[-122.45, 37.73], [-122.47, 37.76], [-122.47, 37.71], [-122.45, 37.73]],
        ],
        zipcode: 94107,
        population: 26599,
        area: 6.11,
      },
    ];

    return new TileLayer({
      id: SLIPPY_TILE_LAYER_ID,
      data: null,
      pickable: false,
      renderSubLayers: (props: any) => {
        const foo = 'bar';
        return [
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
            getLineWidth: 1,
            lineWidthMinPixels: 2,
          }),
          new TextLayer({
            id: `${props.id}-text`,
            // dummy data otherwise the layer doesn't render
            data,
            getPosition: (object) => {
              const [[w, s], [e, n]] = props.tile.boundingBox;
              return [(w + e) / 2, (s + n) / 2];
            },
            getText: (object) => {
              const { z, x, y } = props.tile.index;
              return `z:${z}, x:${x}, y:${y}`;
            },
            getSize: 16,
            getAngle: 0,
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'center',
          }),
        ];
      },
    });
  }
}

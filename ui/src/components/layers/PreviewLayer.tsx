/* eslint-disable class-methods-use-this */
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import { useDispatch, useSelector } from 'react-redux';
import { setViewState } from '@carto/react-redux';
import { load, parse } from '@loaders.gl/core';
import { binaryToGeometry } from '@loaders.gl/gis';
import '@loaders.gl/polyfills';
import type { BinaryGeometry, Geometry } from '@loaders.gl/schema';
import { SHPLoader } from '@loaders.gl/shapefile';
import { ZipLoader } from '@loaders.gl/zip';
import { useEffect, useState } from 'react';
import { setErrorMessage, setFileUrl, setIsLoadingPreview } from 'store/previewSlice';
import { RootState } from 'store/store';
import bboxToViewStateParams from 'utils/bboxToViewStateParams';
import { hexToRgb } from 'utils/colors';

export const PREVIEW_LAYER_ID = 'previewLayer';

type Feature = any;

const joinProperties = (geometries: Geometry[], properties: object[]): Feature[] => {
  const features: Feature[] = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    const feature: Feature = {
      type: 'Feature',
      geometry,
      // properties can be undefined if dbfResponse above was empty
      properties: (properties && properties[i]) || {},
    };
    features.push(feature);
  }

  return features;
};

const parseGeometries = (geometries: BinaryGeometry[]): Geometry[] => {
  const geojsonGeometries: any[] = [];
  for (const geom of geometries) {
    geojsonGeometries.push(binaryToGeometry(geom));
  }
  return geojsonGeometries;
};

export default function PreviewLayer() {
  const { previewLayer } = useSelector((state: RootState) => state.carto.layers);
  const { fileUrl } = useSelector((state: RootState) => state.preview);
  // @ts-ignore
  const [data, setData] = useState(null);
  const dispatch = useDispatch();
  const { viewState } = useSelector((state: RootState) => state.carto);

  useEffect(() => {
    if (fileUrl == null) {
      setData(null);
      return;
    }
    dispatch(setIsLoadingPreview(true));
    setData(
      load(
        `cors-anywhere/${fileUrl}`,
        ZipLoader,
        {
          fetch: {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
          },
        },
      // @ts-ignore
      ).then((d) => {
        const filename = Object.keys(d).find((k) => k.endsWith('.shp'));
        return parse(d[filename], [SHPLoader], { shapefile: { shape: 'geojson-table' } });
      }).then((d: object) => {
        // console.log(d);
        // @ts-ignore
        const geometries = parseGeometries(d.geometries);
        const features = joinProperties(geometries, []);
        // @ts-ignore
        const { header } = d;
        const ret = {
          header,
          features,
          shape: 'geojson-table',
          type: 'FeatureCollection',
        };
        // console.log(ret);
        const {
          minX: minLon,
          minY: minLat,
          maxX: maxLon,
          maxY: maxLat,
        } = header.bbox;
        const bbox = {
          minLon, minLat, maxLon, maxLat,
        };
        // TODO: convert to a utility with bbox and dispatch as params - we've used this thrice by now
        const { width, height } = viewState;
        const viewStateParams = bboxToViewStateParams({ bbox, width, height });
        const zoom = Math.max(viewStateParams.zoom, 2);
        // @ts-ignore
        dispatch(setViewState({ ...viewState, ...viewStateParams, zoom }));
        return ret;
      }).catch((e) => {
        dispatch(setFileUrl(null));
        dispatch(setErrorMessage(e.message));
      })
        .finally(() => {
          dispatch(setIsLoadingPreview(false));
        }),
    );
  }, [fileUrl]);

  if (previewLayer && data) {
    return new GeoJsonLayer({
      id: PREVIEW_LAYER_ID,
      data,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      getLineColor: [...hexToRgb('#9c27b0')],
      getFillColor: [...hexToRgb('#9c27b0'), 0.5],
    });
  }
}

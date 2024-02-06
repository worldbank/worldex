/* eslint-disable class-methods-use-this */
import { useSelector } from 'react-redux';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
// import { CartoLayer } from '@deck.gl/carto';
import { RootState } from 'store/store';
import { SHPLoader, ShapefileLoader } from '@loaders.gl/shapefile';
import { ZipLoader } from '@loaders.gl/zip';
import { load, parse } from '@loaders.gl/core';
import { useEffect, useState } from 'react';
import '@loaders.gl/polyfills';
import type { BinaryGeometry, Geometry } from '@loaders.gl/schema';
import { binaryToGeometry } from '@loaders.gl/gis';
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
  const { previewedFileUrl } = useSelector((state: RootState) => state.selected);
  // @ts-ignore
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!previewedFileUrl) {
      setData(null);
    }
    setData(
      load(
        `https://cors-anywhere.herokuapp.com/${previewedFileUrl}`,
        ZipLoader,
      // @ts-ignore
      ).then((d) => {
        const filename = Object.keys(d).find((k) => k.endsWith('.shp'));
        return parse(d[filename], [SHPLoader], { shapefile: { shape: 'geojson-table' } });
      }).then((d: object) => {
        console.log(d);
        // @ts-ignore
        const geometries = parseGeometries(d.geometries);
        const features = joinProperties(geometries, []);
        const ret = {
          // @ts-ignore
          header: d.header,
          features,
          shape: 'geojson-table',
          type: 'FeatureCollection',
        };
        console.log(ret);
        return ret;
      }),
    );
  }, [previewedFileUrl]);

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

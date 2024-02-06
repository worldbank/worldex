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
  // @ts-ignore
  const [data, setData] = useState(null);
  useEffect(() => {
    console.log('setting data');
    setData(
      load(
        'https://cors-anywhere.herokuapp.com/data.humdata.org/dataset/7ae5e7fb-7754-4a5c-8fc0-2fef0f60cfa0/resource/814d9449-37a2-488f-8de4-205c64b43ea3/download/djiroad2001ignundp.zip',
        ZipLoader,
      // @ts-ignore
      ).then((d) => {
        // const foo = 'bar';
        console.log('unzipped', d);
        // @ts-ignore
        return parse(d['DJI_Road_2001_IGN_UNDP.shp'], [SHPLoader], { shapefile: { shape: 'geojson-table' } });
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
  }, []);

  if (previewLayer && data) {
    return new GeoJsonLayer({
      id: PREVIEW_LAYER_ID,
      data,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      getLineColor: [0, 255, 0],
      getFillColor: [0, 255, 0, 0.5],
    });
  }
}

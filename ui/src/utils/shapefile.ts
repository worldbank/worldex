// Lifted from https://github.com/visgl/loaders.gl/blob/ad75df5bd79d8ff21f3a598cc5d10e97786e47ba/modules/shapefile/src/lib/parsers/parse-shapefile.ts
// so we can support loading shapefiles in the form of an array of ArrayBuffers from ZipLoader
import { binaryToGeometry } from '@loaders.gl/gis';
import '@loaders.gl/polyfills';
import type { BinaryGeometry, Geometry } from '@loaders.gl/schema';

type Feature = any;

export const joinProperties = (geometries: Geometry[], properties: object[]): Feature[] => {
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

export const parseGeometries = (geometries: BinaryGeometry[]): Geometry[] => {
  const geojsonGeometries: any[] = [];
  for (const geom of geometries) {
    geojsonGeometries.push(binaryToGeometry(geom));
  }
  return geojsonGeometries;
};

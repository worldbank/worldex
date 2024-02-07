/* eslint-disable no-restricted-syntax */

// Lifted from https://github.com/visgl/loaders.gl/blob/ad75df5bd79d8ff21f3a598cc5d10e97786e47ba/modules/shapefile/src/lib/parsers/parse-shapefile.ts
// so we can support loading shapefiles in the form of an array of ArrayBuffers from ZipLoader
import { binaryToGeometry } from '@loaders.gl/gis';
import '@loaders.gl/polyfills';
import type { BinaryGeometry, Geometry } from '@loaders.gl/schema';
import { parseShx } from './parse-shx';

type Feature = any;

interface SHXOutput {
  offsets: Int32Array;
  lengths: Int32Array;
}

const _getFilenameByExtension = (filenames: string[], extension: string) => (
  filenames.find((filename) => filename.endsWith(extension))
);

const _arrayBufferToText = (arrayBuf: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(arrayBuf);
  const textDecoder = new TextDecoder('utf-8'); // Specify the encoding if it's different
  return textDecoder.decode(uint8Array);
};

export const loadShapefileSidecarFiles = (zipFileMap: {
  [key: string]: ArrayBuffer,
}): {
  shx?: SHXOutput,
  cpg?: string;
  prj?: string;
} => {
  const filenames = Object.keys(zipFileMap);

  const filenameCpg = _getFilenameByExtension(filenames, '.cpg');
  const cpg = _arrayBufferToText(zipFileMap[filenameCpg]);

  const filenamePrj = _getFilenameByExtension(filenames, '.prj');
  const prj = _arrayBufferToText(zipFileMap[filenamePrj]);

  const filenameShx = _getFilenameByExtension(filenames, '.shx');
  const shx = parseShx(zipFileMap[filenameShx]);

  return {
    shx,
    cpg,
    prj,
  };
};

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

/* eslint-disable class-methods-use-this */
import { useSelector } from 'react-redux';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
// import { CartoLayer } from '@deck.gl/carto';
import { RootState } from 'store/store';
import { SHPLoader, ShapefileLoader } from '@loaders.gl/shapefile';
// import { ZipLoader } from '@loaders.gl/zip';
import { load } from '@loaders.gl/core';
import { useEffect, useState } from 'react';
import '@loaders.gl/polyfills';

export const PREVIEW_LAYER_ID = 'previewLayer';

export default function PreviewLayer() {
  const { previewLayer } = useSelector((state: RootState) => state.carto.layers);
  // @ts-ignore
  const [data, setData] = useState(null);
  useEffect(() => {
    console.log('setting data');
    setData(
      // load(
      //   'https://cors-anywhere.herokuapp.com/data.humdata.org/dataset/e444670e-1766-4a32-b913-25fc8488ddd8/resource/889762d6-31ea-436c-b9ac-1ca589ce5196/download/khm_rdsl_gov.zip',
      //   ZipLoader,
      // // @ts-ignore
      // ).then((d) => {
      //   // const foo = 'bar';
      //   console.log('unzipped', d);
      //   return load('https://cors-anywhere.herokuapp.com/raw.githubusercontent.com/visgl/loaders.gl/master/modules/shapefile/test/data/graticules-and-countries/99bfd9e7-bb42-4728-87b5-07f8c8ac631c2020328-1-1vef4ev.lu5nk.shp', [ShapefileLoader], { shapefile: { shape: 'geojson-table' } });
      //   // return parse(d, ShapefileLoader);
      //   // console.log('ahhh');
      //   // console.log('!', d);
      //   // return load(d['khm_rdsl_gov.shp'], SHPLoader);
      // }).then((d) => {
      //   console.log('shape-loaded', d);
      //   return d as Table;
      //   // console.log('boooh');
      //   // console.log('~', d);
      //   // return d.geometries[0];
      // }),
      load(
        'https://raw.githubusercontent.com/visgl/deck.gl-data/master/test-data/shapefile/geo_export_14556060-0002-4a9e-8ef0-03da3e246166.shp',
        [ShapefileLoader],
        { worker: false, shapefile: { shape: 'geojson-table' } },
      ),
    );
  }, []);

  if (previewLayer && data) {
    return new GeoJsonLayer({
      id: PREVIEW_LAYER_ID,
      data,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [0, 255, 0],
      getFillColor: [0, 255, 0, 0.5],
    });
  }
}

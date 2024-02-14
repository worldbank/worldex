import { useSelector } from 'react-redux';
// @ts-ignore
import { CartoLayer } from '@deck.gl/carto';
import { selectSourceById } from '@carto/react-redux';
import { useCartoLayerProps } from '@carto/react-api';
import htmlForFeature from 'utils/htmlForFeature';
import { RootState } from 'store/store';
import { BitmapLayer } from '@deck.gl/layers/typed';
import { useEffect, useState } from 'react';
import { fromUrl, fromArrayBuffer } from 'geotiff';
import { GeoTIFFLoader } from '@loaders.gl/geotiff';
import '@loaders.gl/polyfills'; // only needed if using under Node
import { ImageLoader } from '@loaders.gl/images';
import { load } from '@loaders.gl/core';
import GL from '@luma.gl/constants';

export const TIF_PREVIEW_LAYER_ID = 'tifPreviewLayer';

export default function TifPreviewLayer() {
  const { tifPreviewLayer } = useSelector((state: RootState) => state.carto.layers);

  const [tiffData, setTiffData] = useState(null);
  const tifUrl = 'https://data.worldpop.org/GIS/Population/Global_2000_2020_1km/2020/JPN/jpn_ppp_2020_1km_Aggregated.tif';
  const loadTiff = async () => {
    fromUrl(
      `/cors-anywhere/${tifUrl}`,
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    ).then(
      (tiff: any) => {
        console.log('tiff', tiff);
        return Promise.all([tiff.getImage(), tiff.getImageCount()]);
      },
    )
      .then(
        ([image, imageCount]) => {
          console.log('image', image, image.getBoundingBox());
          console.log('image count', imageCount);
          return Promise.all([
            image.readRasters({ interleave: true, enableAlpha: false }),
            image.getBoundingBox(),
            image.readRGB({ interleave: true, enableAlpha: false }),
            image.getWidth(),
            image.getHeight(),
            image.getTileWidth(),
            image.getTileHeight(),
          ]);
        },
      )
      .then(
        // @ts-ignore s
        ([rasters, bbox, rgb, width, height, tileWidth, tileHeight]) => {
          console.log('rasters', rasters);
          console.log('rgb', rgb);
          console.log('bbox', bbox);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set canvas dimensions to match image size
          canvas.width = rasters.width / 4;
          canvas.height = rasters.height / 4;

          // Create ImageData object from raster data
          // @ts-ignore
          const imageData = ctx.createImageData(width, height);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          imageData.data.set(rasters);

          // Draw ImageData onto canvas
          ctx.putImageData(imageData, 0, 0);

          // Convert canvas content to PNG data URL
          const pngDataUrl = canvas.toDataURL('image/png');
          // console.log(pngDataUrl);
          setTiffData({ dataUrl: pngDataUrl, bbox });

          return {
            dataUrl: pngDataUrl,
            bbox,
          };
        },
      );
  };

  useEffect(() => {
    // Load the TIFF file
    setTiffData(loadTiff());
  //   // setTiffData(
  //   load(
  //     `cors-anywhere/${tifUrl}`,
  //     GeoTIFFLoader,
  //     {
  //       fetch: {
  //         headers: {
  //           'X-Requested-With': 'XMLHttpRequest',
  //         },
  //       },
  //       enableAlpha: true,
  //     },
  //   ).then((d) => {
  //     console.log(d);
  //     setTiffData({
  //       dataUrl: {
  //         data: d.data,
  //         width: d.width,
  //         height: d.height,
  //         format: GL.RGBA,
  //         mipmaps: false,
  //       },
  //       bbox: d.bounds,
  //     });
  //   });
  //   // );
  }, []);

  // if (tifPreviewLayer && tiffData?.bbox) {
  if (tifPreviewLayer && tiffData?.dataUrl) {
    console.log('tiffData', tiffData);
    return new BitmapLayer({
      id: TIF_PREVIEW_LAYER_ID,
      // loadOptions: {
      //   fetch: {
      //     headers: {
      //       'X-Requested-With': 'XMLHttpRequest',
      //     },
      //   },
      // },
      image: tiffData.dataUrl,
      // image: `/cors-anywhere/${tifUrl}`,
      // image: `cors-anywhere/${tifUrl}`,
      loaders: [GeoTIFFLoader, ImageLoader],
      // loaders: [GeoTIFFLoader, ImageLoader],
      // @ts-ignore
      bounds: [...tiffData.bbox],
      // bounds: [
      //   [-80.425, 37.936],
      //   [-80.425, 46.437],
      //   [-71.516, 46.437],
      //   [-71.516, 37.936],
      // ],
      // image: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif',
    });
  }
}

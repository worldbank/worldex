import { useSelector } from 'react-redux';
// @ts-ignore
import { RootState } from 'store/store';
import { BitmapLayer } from '@deck.gl/layers/typed';
import { useEffect, useState } from 'react';
import GeoTIFF, { fromUrl, GeoTIFFImage, ReadRasterResult } from 'geotiff';
import { GeoTIFFLoader } from '@loaders.gl/geotiff';
import '@loaders.gl/polyfills'; // only needed if using under Node
import { ImageLoader } from '@loaders.gl/images';

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
      // returns the first image
      (tiff: GeoTIFF) => tiff.getImage(),
    )
      .then(
        (image: GeoTIFFImage) => Promise.all([
          image.readRasters({ interleave: true }),
          image.getBoundingBox(),
          image.getWidth(),
          image.getHeight(),
        ]),
      )
      .then(
        ([rasters, bbox, width, height]: [ReadRasterResult, Array<number>, number, number]) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set canvas dimensions to match image size
          canvas.width = rasters.width / 4;
          canvas.height = rasters.height / 4;

          // Create ImageData object from raster data
          const imageData = ctx.createImageData(width, height);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // @ts-ignore
          imageData.data.set(rasters);

          // Draw ImageData onto canvas
          ctx.putImageData(imageData, 0, 0);

          // Convert canvas content to PNG data URL
          const dataUrl = canvas.toDataURL('image/png');
          setTiffData({ dataUrl, bbox });
        },
      );
  };

  useEffect(() => {
    // Load the TIFF file
    setTiffData(loadTiff());
  }, []);

  if (tifPreviewLayer && tiffData?.dataUrl) {
    console.log('tiffData', tiffData);
    return new BitmapLayer({
      id: TIF_PREVIEW_LAYER_ID,
      image: tiffData.dataUrl,
      // @ts-ignore
      bounds: [...tiffData.bbox],
    });
  }
}

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

export const TIF_PREVIEW_LAYER_ID = 'tifPreviewLayer';

export default function TifPreviewLayer() {
  const { tifPreviewLayer } = useSelector((state: RootState) => state.carto.layers);

  const [tiffData, setTiffData] = useState(null);
  const tifUrl = 'https://data.worldpop.org/GIS/Population_Density/Global_2000_2020_1km_UNadj/2019/PHL/phl_pd_2019_1km_UNadj.tif';
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
        return tiff.readRasters();
      },
    )
      .then(
        (rasters) => {
          console.log('rasters', rasters);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set canvas dimensions to match image size
          canvas.width = rasters.width;
          canvas.height = rasters.height;

          // Create ImageData object from raster data
          const imageData = ctx.createImageData(rasters.width, rasters.height);
          imageData.data.set(rasters[0]);

          // Draw ImageData onto canvas
          ctx.putImageData(imageData, 0, 0);

          // Convert canvas content to PNG data URL
          const pngDataUrl = canvas.toDataURL('image/png');
          setTiffData(`${pngDataUrl}`);
          return pngDataUrl;
        },
      );
  };

  useEffect(() => {
    // Load the TIFF file
    setTiffData(loadTiff());
  }, []);

  if (tifPreviewLayer && tiffData) {
    console.log(tiffData);
    return new BitmapLayer({
      id: TIF_PREVIEW_LAYER_ID,
      image: tiffData,
      loaders: [ImageLoader],
      bounds: [116, 4.383, 127, 21],
    });
  }
}

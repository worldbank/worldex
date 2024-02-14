import { useSelector } from 'react-redux';
// @ts-ignore
import { RootState } from 'store/store';
import { BitmapLayer } from '@deck.gl/layers/typed';
import { useEffect, useState } from 'react';
import GeoTIFF, { fromUrl, GeoTIFFImage, ReadRasterResult } from 'geotiff';
import '@loaders.gl/polyfills';

export const TIF_PREVIEW_LAYER_ID = 'tifPreviewLayer';

export default function TifPreviewLayer() {
  const { tifPreviewLayer } = useSelector((state: RootState) => state.carto.layers);
  const { fileUrl } = useSelector((state: RootState) => state.preview);

  const [tifData, setTifData] = useState(null);
  // const tifUrl = 'https://data.worldpop.org/GIS/Population/Global_2000_2020_1km/2020/JPN/jpn_ppp_2020_1km_Aggregated.tif';
  // const tifUrl = 'https://data.humdata.org/dataset/f468b878-9b9b-4a85-8b38-19d025f960af/resource/31cc3532-e7e3-4c49-82d5-8ff23e679732/download/cagayan_ompong.tif';

  useEffect(() => {
    if (fileUrl == null) {
      if (tifData !== null) {
        setTifData(null);
      }
    } else if (['.tif', '.tiff', '.geotif', '.geotiff'].some((ext) => fileUrl.endsWith(ext))) {
      // TODO: inspect mimetype as well? or copy how GeoTIFFLoader checks the magic numbers
      fromUrl(
        `/cors-anywhere/${fileUrl}`,
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
            setTifData({ dataUrl, bbox });
          },
        );
    }
  }, [fileUrl]);

  if (tifPreviewLayer && tifData) {
    return new BitmapLayer({
      id: TIF_PREVIEW_LAYER_ID,
      image: tifData.dataUrl,
      // @ts-ignore
      bounds: [...tifData.bbox],
    });
  }
}

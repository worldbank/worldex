import { useSelector } from 'react-redux';
// @ts-ignore
import { BitmapLayer } from '@deck.gl/layers/typed';
import '@loaders.gl/polyfills';
import GeoTIFF, {
  GeoTIFFImage,
  ReadRasterResult,
  fromUrl,
} from 'geotiff';
import { useEffect, useState } from 'react';
import { RootState } from 'store/store';

export const TIF_PREVIEW_LAYER_ID = 'tifPreviewLayer';

export default function TifPreviewLayer() {
  const { tifPreviewLayer } = useSelector((state: RootState) => state.carto.layers);
  const { fileUrl } = useSelector((state: RootState) => state.preview);

  const [tifData, setTifData] = useState(null);

  useEffect(() => {
    if (fileUrl == null) {
      if (tifData !== null) {
        setTifData(null);
      }
    } else if (['.tif', '.tiff', '.geotif', '.geotiff'].some((ext) => fileUrl.endsWith(ext))) {
      // TODO: inspect mimetype as well? or copy how GeoTIFFLoader checks the magic numbers
      fetch(
        '/api/tif_as_png/',
        {
          method: 'post',
          body: JSON.stringify({
            url: fileUrl,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ).then(
        (resp: Response) => resp.json(),
      ).then(
        (resp) => {
          const { data_url, bbox } = resp;
          setTifData({ dataUrl: data_url, bbox });
        },
      );
      // fromUrl(
      //   `cors-anywhere/${fileUrl}`,
      //   {
      //     headers: {
      //       'X-Requested-With': 'XMLHttpRequest',
      //     },
      //     allowFullFile: true,
      //   },
      // ).then(
      //   // returns the first image
      //   (tiff: GeoTIFF) => tiff.getImage(),
      // )
      //   .then(
      //     (image: GeoTIFFImage) => Promise.all([
      //       image.readRasters({ interleave: true }),
      //       image.getBoundingBox(),
      //       image.getWidth(),
      //       image.getHeight(),
      //     ]),
      //   )
      //   .then(
      //     ([rasters, bbox, width, height]: [ReadRasterResult, Array<number>, number, number]) => {
      //       const canvas = document.createElement('canvas');
      //       const ctx = canvas.getContext('2d');

      //       // Set canvas dimensions to match image size
      //       canvas.width = rasters.width / 4;
      //       canvas.height = rasters.height / 4;

      //       // Create ImageData object from raster data
      //       const imageData = ctx.createImageData(width, height);
      //       ctx.clearRect(0, 0, canvas.width, canvas.height);
      //       // @ts-ignore
      //       imageData.data.set(rasters);

      //       // Draw ImageData onto canvas
      //       ctx.putImageData(imageData, 0, 0);

      //       // Convert canvas content to PNG data URL
      //       const dataUrl = canvas.toDataURL('image/png');
      //       setTifData({ dataUrl, bbox });
      //     },
      //   );
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

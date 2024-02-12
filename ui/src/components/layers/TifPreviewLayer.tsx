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

// fetch('path/to/your/file.tif')
//     .then(response => response.arrayBuffer())
//     .then(buffer => {
//         // Parse the TIF file
//         return GeoTIFF.fromArrayBuffer(buffer);
//     })
//     .then(tiff => {
//         // Read the first image from the TIF file
//         return tiff.getImage();
//     })
//     .then(image => {
//         // Get the raster data from the TIF image
//         return image.readRasters();
//     })
//     .then(rasters => {
//         // Create a new ImageData object with the raster data
//         const imageData = new ImageData(new Uint8ClampedArray(rasters[0]), canvas.width, canvas.height);
//         // Put the ImageData onto the canvas
//         ctx.putImageData(imageData, 0, 0);

//         // Convert canvas to PNG and trigger download
//         const pngUrl = canvas.toDataURL('image/png');
//         const downloadLink = document.createElement('a');
//         downloadLink.href = pngUrl;
//         downloadLink.download = 'output_image.png';
//         downloadLink.click();
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });

export default function TifPreviewLayer() {
  const { tifPreviewLayer } = useSelector((state: RootState) => state.carto.layers);
  // const source = useSelector((state) =>
  //   selectSourceById(state, tifPreviewLayer?.source),
  // );

  const [tiffData, setTiffData] = useState(null);

  useEffect(() => {
    // Load the TIFF file
    const loadTiff = async () => {
      fetch('/cors-anywhere/https://data.worldpop.org/GIS/Population_Density/Global_2000_2020_1km_UNadj/2019/PHL/phl_pd_2019_1km_UNadj.tif', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      }).then(
        (response) => response.arrayBuffer(),
      ).then(
        (buffer) => fromArrayBuffer(buffer),
      ).then(
        (tiff: any) => {
          console.log(tiff);
          return tiff.getImage();
        },
      )
        .then(
          (image) => {
            console.log(image);
            console.log(image.readRasters());
            return image.readRasters();
          },
        )
        .then(
          (rasters) => {
            console.log(rasters);
            // const imageData = new Uint8Array(rasters[0]); // Assuming it's an 8-bit image
            // const { width, height } = rasters;
            // // Now, you can use imageData to create a PNG or JPEG format.
            // // You might need to use canvas or other methods to convert the image data.
            // // For example, if you already have the PNG data:
            // const blob = new Blob([imageData], { type: 'image/png' });
            // const pngDataUrl = URL.createObjectURL(blob);
            // console.log(pngDataUrl);
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
      // const response = await fromUrl('https://cors-anywhere.herokuapp.com/https://data.worldpop.org/GIS/Population_Density/Global_2000_2020_1km/2020/PHL/phl_pd_2020_1km.tif');
      // return response;
      // setTiffData(response.getImage());
    };

    loadTiff();

    // loadTiff().then((r) => setTiffData(r));
  }, []);

  if (tifPreviewLayer && tiffData) {
    console.log(tiffData);
    return new BitmapLayer({
      id: TIF_PREVIEW_LAYER_ID,
      image: tiffData,
      loaders: [ImageLoader],
      bounds: [116, 4.383, 127, 21],
      // url: 'https://cors-anywhere.herokuapp.com/https://data.worldpop.org/GIS/Population_Density/Global_2000_2020_1km/2020/PHL/phl_pd_2020_1km.tif',
      // loaders: [GeoTIFFLoader],
      // image: new Uint8Array(data),
      // width,
      // height,
    });
  }
}

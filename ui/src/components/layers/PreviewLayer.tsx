/* eslint-disable class-methods-use-this */
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import { useDispatch, useSelector } from 'react-redux';
import { setViewState } from '@carto/react-redux';
import { load, parse } from '@loaders.gl/core';
import '@loaders.gl/polyfills';
import { SHPLoader } from '@loaders.gl/shapefile';
import { ZipLoader } from '@loaders.gl/zip';
import { useEffect, useState } from 'react';
import { setErrorMessage, setFileUrl, setIsLoadingPreview } from 'store/previewSlice';
import { RootState } from 'store/store';
import bboxToViewStateParams from 'utils/bboxToViewStateParams';
import { hexToRgb } from 'utils/colors';
import { joinProperties, loadShapefileSidecarFiles, parseGeometries } from 'utils/shapefile/shapefile';

export const PREVIEW_LAYER_ID = 'previewLayer';

export default function PreviewLayer() {
  const { previewLayer } = useSelector((state: RootState) => state.carto.layers);
  const { fileUrl } = useSelector((state: RootState) => state.preview);
  // @ts-ignore
  const [data, setData] = useState(null);
  const dispatch = useDispatch();
  const { viewState } = useSelector((state: RootState) => state.carto);
  const PURPLE_500 = '#9c27b0';

  useEffect(() => {
    if (fileUrl == null) {
      setData(null);
      return;
    } else if (fileUrl.endsWith('.geojson')) {
      setData(fileUrl);
      return;
    }
    dispatch(setIsLoadingPreview(true));
    setData(
      load(
        `cors-anywhere/${fileUrl}`,
        ZipLoader,
        {
          fetch: {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
          },
        },
      // @ts-ignore
      ).then((zipFileMap) => {
        const filename = Object.keys(zipFileMap).find((k) => k.endsWith('.shp'));
        if (!filename) {
          throw new Error('No shapefile contained in zipfile');
        }
        const { shx, cpg, prj } = loadShapefileSidecarFiles(zipFileMap);
        const shp = parse(zipFileMap[filename], [SHPLoader], { shapefile: { shape: 'geojson-table' } });
        return Promise.all([shp, shx, cpg, prj]);
      }).then(([
        shp,
        shx,
        cpg,
        prj,
      ]) => {
        // @ts-ignore
        const geometries = parseGeometries(shp.geometries);
        const features = joinProperties(geometries, []);
        // @ts-ignore
        const { header } = shp;

        const {
          minX: minLon,
          minY: minLat,
          maxX: maxLon,
          maxY: maxLat,
        } = header.bbox;
        const bbox = {
          minLon, minLat, maxLon, maxLat,
        };
        // TODO: convert to a utility with bbox and dispatch as params - we've done this thrice by now
        const { width, height } = viewState;
        const viewStateParams = bboxToViewStateParams({ bbox, width, height });
        const zoom = Math.max(viewStateParams.zoom, 2);
        // @ts-ignore
        dispatch(setViewState({ ...viewState, ...viewStateParams, zoom }));

        return {
          shape: 'geojson-table',
          type: 'FeatureCollection',
          encoding: cpg,
          prj,
          shx,
          header,
          features,
        };
      }).catch((e) => {
        dispatch(setFileUrl(null));
        dispatch(setErrorMessage(e.message));
      })
        .finally(() => {
          dispatch(setIsLoadingPreview(false));
        }),
    );
  }, [fileUrl]);

  if (previewLayer && data) {
    return new GeoJsonLayer({
      id: PREVIEW_LAYER_ID,
      data,
      pickable: true,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      getLineColor: [...hexToRgb(PURPLE_500)],
      getFillColor: [...hexToRgb(PURPLE_500), 0.5],
    });
  }
}

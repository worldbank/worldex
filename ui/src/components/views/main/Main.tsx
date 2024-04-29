import { AT as atRegex } from 'constants/regex';
import {
  addLayer,
  addSource,
  removeLayer,
  removeSource,
  setViewState,
} from '@carto/react-redux';
import h3CellsSource from 'data/sources/h3CellsSource';
import { lazy, useCallback, useEffect } from 'react';

import { SLIPPY_TILE_LAYER_ID } from 'components/layers/SlippyTileLayer';

import { DATASET_COUNT_LAYER_ID } from 'components/layers/DatasetCountLayer';
import { DATASET_COVERAGE_LAYER_ID } from 'components/layers/DatasetCoverageLayer';
import { GEOJSON_PREVIEW_LAYER_ID } from 'components/layers/GeojsonPreviewLayer';
import { SEARCH_LAYER_ID } from 'components/layers/SearchLayer';
import { TIF_PREVIEW_LAYER_ID } from 'components/layers/TifPreviewLayer';
import datasetCoverageSource from 'data/sources/datasetCoverageSource';
import { useDispatch, useSelector } from 'react-redux';

import { debounce, Grid, Modal } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMapHooks } from 'components/common/map/useMapHooks';
import { useSearchParams } from 'react-router-dom';
import { RootState } from 'store/store';
import LazyLoadComponent from 'components/common/LazyLoadComponent';
import AccessBlocker from 'components/common/AccessBlocker';

const MapContainer = lazy(
  () => import(
    /* webpackChunkName: 'map-container' */ 'components/views/main/MapContainer'
  ),
);
const Sidebar = lazy(
  () => import(
    /* webpackChunkName: 'sidebar' */ 'components/views/main/sidebar/Sidebar'
  ),
);
const ErrorSnackbar = lazy(
  () => import(
    /* webpackChunkName: 'error-snackbar' */ 'components/common/ErrorSnackbar'
  ),
);

const GridMain = styled(Grid)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'stretch',

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column-reverse',
  },
}));

interface AtArgs {
  latitude: number;
  longitude: number;
  zoom?: number;
  unblock?: boolean;
}

export default function Main() {
  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const { latitude, longitude, zoom } = viewState;

  const [searchParams, setSearchParams] = useSearchParams();
  const debouncedSetSearchParams = useCallback(debounce(setSearchParams, 300), []);
  const dispatch = useDispatch();
  const shouldBlockAccess = (import.meta.env.VITE_BLOCK_ACCESS === 'true');

  useEffect(() => {
    const at = searchParams.get('at');
    if (at) {
      const results = atRegex.exec(at ?? '');
      if (results?.groups != null) {
        const atArgs: AtArgs = {
          latitude: parseFloat(results.groups.latitude),
          longitude: parseFloat(results.groups.longitude),
        };
        if (results.groups.zoom) {
          atArgs.zoom = parseFloat(results.groups.zoom);
        }
        // @ts-ignore
        dispatch(setViewState({ ...atArgs }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(addSource(h3CellsSource));
    dispatch(
      addLayer({
        id: DATASET_COUNT_LAYER_ID,
        source: h3CellsSource.id,
      }),
    );
    dispatch(
      addLayer({
        id: SEARCH_LAYER_ID,
      }),
    );

    return () => {
      dispatch(removeLayer(SEARCH_LAYER_ID));
      dispatch(removeLayer(DATASET_COUNT_LAYER_ID));
      dispatch(removeSource(h3CellsSource.id));
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(addSource(datasetCoverageSource));
    dispatch(
      addLayer({
        id: SLIPPY_TILE_LAYER_ID,
        source: datasetCoverageSource.id,
      }),
    );
    dispatch(
      addLayer({
        id: TIF_PREVIEW_LAYER_ID,
      }),
    );
    dispatch(
      addLayer({
        id: GEOJSON_PREVIEW_LAYER_ID,
      }),
    );

    dispatch(
      addLayer({
        id: DATASET_COVERAGE_LAYER_ID,
        source: datasetCoverageSource.id,
      }),
    );

    return () => {
      dispatch(removeLayer(DATASET_COVERAGE_LAYER_ID));
      dispatch(removeLayer(GEOJSON_PREVIEW_LAYER_ID));
      dispatch(removeLayer(TIF_PREVIEW_LAYER_ID));
      dispatch(removeLayer(SLIPPY_TILE_LAYER_ID));
      dispatch(removeSource(datasetCoverageSource.id));
    };
  }, [dispatch]);

  // [hygen] Add useEffect

  useEffect(() => {
    const searchParamKeys = Array.from(searchParams.keys());
    const newSearchParams = {
      at: `${latitude.toFixed(5)},${longitude.toFixed(5)},${zoom.toFixed(2)}z`,
    };
    if (searchParamKeys.includes('unblock')) {
      // @ts-ignore
      newSearchParams.unblock = 'true';
    }
    debouncedSetSearchParams(newSearchParams);
  }, [debouncedSetSearchParams, latitude, longitude, zoom]);

  return (
    <GridMain container item xs>
      <LazyLoadComponent>
        {
          shouldBlockAccess && !searchParams.get('unblock') && <AccessBlocker />
        }
        <Sidebar />
        <MapContainer />
        <ErrorSnackbar />
      </LazyLoadComponent>
    </GridMain>
  );
}

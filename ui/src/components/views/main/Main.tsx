import { ZOOM_H3_RESOLUTION_PAIRS } from 'constants/h3';
import { AT as atRegex } from 'constants/regex';
import {
  addLayer,
  addSource,
  removeLayer,
  removeSource,
} from '@carto/react-redux';
import h3CellsSource from 'data/sources/h3CellsSource';
import { lazy, useEffect } from 'react';
import datasetCoverageSource from 'data/sources/datasetCoverageSource';
import { DATASET_COVERAGE_LAYER_ID } from 'components/layers/DatasetCoverageLayer';
import { DATASET_COUNT_LAYER_ID } from 'components/layers/DatasetCountLayer';
import { SEARCH_LAYER_ID } from 'components/layers/SearchLayer';
import { useDispatch, useSelector } from 'react-redux';

import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import LazyLoadComponent from 'components/common/LazyLoadComponent';
import { useMapHooks } from 'components/common/map/useMapHooks';
import { useParams, useSearchParams } from 'react-router-dom';
import { RootState } from 'store/store';
import { setClosestZoom, setH3Resolution } from 'store/appSlice';
import getClosestZoomResolutionPair from 'utils/getClosestZoomResolutionPair';

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
}

export default function Main() {
  const { debouncedSetViewState } = useMapHooks();
  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const { latitude, longitude, zoom } = viewState;

  const [searchParams, setSearchParams] = useSearchParams();

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
        debouncedSetViewState({
          ...viewState,
          ...atArgs,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useDispatch();
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
        id: DATASET_COVERAGE_LAYER_ID,
        source: datasetCoverageSource.id,
      }),
    );

    return () => {
      dispatch(removeLayer(DATASET_COVERAGE_LAYER_ID));
      dispatch(removeSource(datasetCoverageSource.id));
    };
  }, [dispatch]);

  // [hygen] Add useEffect

  useEffect(() => {
    setSearchParams({ at: `${latitude.toFixed(5)},${longitude.toFixed(5)},${zoom.toFixed(2)}z` });
  }, [setSearchParams, latitude, longitude, zoom]);

  useEffect(() => {
    const [closestZoom, resolution] = getClosestZoomResolutionPair(zoom);
    dispatch(setClosestZoom(closestZoom));
    dispatch(setH3Resolution(resolution));
  }, [dispatch, latitude, longitude, zoom]);

  return (
    <GridMain container item xs>
      <LazyLoadComponent>
        <Sidebar />
        <MapContainer />
        <ErrorSnackbar />
      </LazyLoadComponent>
    </GridMain>
  );
}

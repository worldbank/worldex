import { lazy, useEffect } from 'react';
import h3CellsSource from 'data/sources/h3CellsSource';
import { H3_CELLS_LAYER_ID } from 'components/layers/H3CellsLayer';
import { useDispatch } from 'react-redux';
import {
  addLayer,
  removeLayer,
  addSource,
  removeSource,
} from '@carto/react-redux';

import LazyLoadComponent from 'components/common/LazyLoadComponent';
import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

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

export default function Main() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(addSource(h3CellsSource));

    dispatch(
      addLayer({
        id: H3_CELLS_LAYER_ID,
        source: h3CellsSource.id,
      }),
    );

    return () => {
      dispatch(removeLayer(H3_CELLS_LAYER_ID));
      dispatch(removeSource(h3CellsSource.id));
    };
  }, [dispatch]);

  // [hygen] Add useEffect

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

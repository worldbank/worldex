import { lazy } from 'react';
import { useEffect } from 'react';
import h3Source from 'data/sources/h3Source';
import { H3_LAYER_ID } from 'components/layers/H3Layer';
import { useDispatch } from 'react-redux';
import {
  addLayer,
  removeLayer,
  addSource,
  removeSource,
} from '@carto/react-redux';

import LazyLoadComponent from 'components/common/LazyLoadComponent';
import { styled } from '@mui/material/styles';
import { Grid } from '@mui/material';

const MapContainer = lazy(() =>
  import(/* webpackChunkName: 'map-container' */ 'components/views/main/MapContainer')
);
const Sidebar = lazy(() =>
  import(/* webpackChunkName: 'sidebar' */ 'components/views/main/sidebar/Sidebar')
);
const ErrorSnackbar = lazy(() =>
  import(/* webpackChunkName: 'error-snackbar' */ 'components/common/ErrorSnackbar')
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
    dispatch(addSource(h3Source));

    dispatch(
      addLayer({
        id: H3_LAYER_ID,
        source: h3Source.id,
      }),
    );

    return () => {
      dispatch(removeLayer(H3_LAYER_ID));
      dispatch(removeSource(h3Source.id));
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

import { lazy } from 'react';
import ProtectedRoute from 'components/common/ProtectedRoute';
import DefaultView from 'components/common/DefaultView';
import SidebarContent from 'components/common/sidebar/Content';

const Main = lazy(
  () => import(/* webpackPrefetch: true */ 'components/views/main/Main'),
);
const NotFound = lazy(() => import('components/views/NotFound'));
// [hygen] Import views

export const ROUTE_PATHS = {
  LOGIN: '/login',
  DEFAULT: '/',
  NOT_FOUND: '/404',
  // [hygen] Add path routes
};

const routes = [
  {
    path: ROUTE_PATHS.DEFAULT,
    element: (
      <ProtectedRoute>
        <DefaultView>
          <Main />
        </DefaultView>
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <SidebarContent />,
      },
    ],
  },
  {
    path: '*',
    element: (
      <DefaultView>
        <NotFound />
      </DefaultView>
    ),
  },
];

export default routes;

import { setViewState, ViewState } from '@carto/react-redux';
import { BoundingBox } from 'components/common/types';
import bboxToViewStateParams from './bboxToViewStateParams';

// should this utility function be a reducer?
// @ts-ignore
const moveViewportToBbox = (bbox: BoundingBox, viewState: ViewState, dispatch: any) => {
  const { width, height } = viewState;
  const viewStateParams = bboxToViewStateParams({ bbox, width, height });
  const zoom = Math.max(viewStateParams.zoom, 2);
  dispatch(setViewState({ ...viewState, ...viewStateParams, zoom }));
};

export default moveViewportToBbox;

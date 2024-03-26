import { setViewState, ViewState } from '@carto/react-redux';
import { BoundingBox } from 'components/common/types';
import { setSteppedZoom } from 'store/appSlice';
import bboxToViewStateParams from './bboxToViewStateParams';
import getSteppedZoomResolutionPair from './getSteppedZoomResolutionPair';

// @ts-ignore
const moveViewportToBbox = (bbox: BoundingBox, viewState: ViewState, dispatch: any): ViewState => {
  const { width, height } = viewState;
  const viewStateParams = bboxToViewStateParams({ bbox, width, height });
  // TODO: add minimum zoom level of 2 as a config
  const zoom = Math.max(viewStateParams.zoom, 2);
  dispatch(setViewState({ ...viewState, ...viewStateParams, zoom }));
  dispatch(setSteppedZoom(getSteppedZoomResolutionPair(zoom)[0]));
  return viewStateParams;
};

export default moveViewportToBbox;

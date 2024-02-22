import { setViewState, ViewState } from '@carto/react-redux';
import { BoundingBox } from 'components/common/types';
import bboxToViewStateParams from './bboxToViewStateParams';

// @ts-ignore
const moveViewportToBbox = (bbox: BoundingBox, viewState: ViewState, dispatch: any): ViewState => {
  const { width, height } = viewState;
  const viewStateParams = bboxToViewStateParams({ bbox, width, height });
  // TODO: add minimum zoom level of 2 as a config
  const zoom = Math.max(viewStateParams.zoom, 2);
  dispatch(setViewState({ ...viewState, ...viewStateParams, zoom }));
  return viewStateParams;
};

export default moveViewportToBbox;

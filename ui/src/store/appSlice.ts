/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'app',
  initialState: {
    error: null,
    bottomSheetOpen: false,
    h3Resolution: null,
    closestZoom: null,
    zIndex: null,
  },
  reducers: {
    setError: (state, action) => {
      state.error = action.payload;
    },
    setBottomSheetOpen: (state, action) => {
      state.bottomSheetOpen = action.payload;
    },
    setH3Resolution: (state, action) => {
      state.h3Resolution = action.payload;
    },
    setClosestZoom: (state, action) => {
      state.closestZoom = action.payload;
    },
    setZIndex: (state, action) => {
      state.zIndex = action.payload;
    },
  },
});

export default slice.reducer;

export const setError = (payload: string | null) => ({
  type: 'app/setError',
  payload,
});
export const setBottomSheetOpen = (payload: boolean) => ({
  type: 'app/setBottomSheetOpen',
  payload,
});
export const setH3Resolution = (payload: number) => ({
  type: 'app/setH3Resolution',
  payload,
});
export const setClosestZoom = (payload: number) => ({
  type: 'app/setClosestZoom',
  payload,
});
export const setZIndex = (payload: number) => ({
  type: 'app/setZIndex',
  payload,
});

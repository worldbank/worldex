/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const initialState: any = {
  fileUrl: null,
  isLoadingPreview: false,
  errorMessage: null,
};

const slice = createSlice({
  name: 'preview',
  initialState,
  reducers: {
    setFileUrl: (state, action) => {
      state.fileUrl = action.payload;
    },
    setIsLoadingPreview: (state, action) => {
      state.isLoadingPreview = action.payload;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    resetByKey: (state, action) => {
      action.payload.forEach((key: string) => {
        state[key] = initialState[key];
      });
    },
  },
});

export default slice.reducer;

export const setFileUrl = (payload: string) => ({
  type: 'preview/setFileUrl',
  payload,
});
export const setIsLoadingPreview = (payload: boolean) => ({
  type: 'preview/setIsLoadingPreview',
  payload,
});
export const setErrorMessage = (payload: string) => ({
  type: 'preview/setErrorMessage',
  payload,
});
export const resetByKey = (...payload: string[]) => ({
  type: 'preview/resetByKey',
  payload,
});

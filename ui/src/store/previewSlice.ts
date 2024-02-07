/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'preview',
  initialState: {
    fileUrl: null,
    isLoadingPreview: false,
    errorMessage: null,
  },
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

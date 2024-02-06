/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'preview',
  initialState: {
    fileUrl: null,
    isLoadingPreview: false,
  },
  reducers: {
    setFileUrl: (state, action) => {
      state.fileUrl = action.payload;
    },
    setIsLoadingPreview: (state, action) => {
      state.isLoadingPreview = action.payload;
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

import { createSlice } from '@reduxjs/toolkit';
import { Dataset } from 'components/common/types';

const slice = createSlice({
  name: 'selected',
  initialState: {
    h3Index: null,
    datasets: null,
    datasetCount: null,
  },
  reducers: {
    setH3Index: (state, action) => {
      state.h3Index = action.payload;
    },
    setDatasets: (state, action) => {
      state.datasets = action.payload;
    },
    setDatasetCount: (state, action) => {
      state.datasetCount = action.payload;
    },
  },
});

export default slice.reducer;

export const setH3Index = (payload: string | null) => ({
  type: 'selected/setH3Index',
  payload,
});
export const setDatasets = (payload: Dataset[]) => ({
  type: 'selected/setDatasets',
  payload,
});
export const setDatasetCount = (payload: number) => ({
  type: 'selected/setDatasetCount',
  payload,
});

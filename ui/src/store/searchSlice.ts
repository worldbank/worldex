/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import { Dataset } from 'components/common/types';

const slice = createSlice({
  name: 'search',
  initialState: {
    query: null,
    location: null,
    lastZoom: null,
    filteredDatasets: null,
    pendingLocationCheck: false,
    datasetIds: [],
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setLastZoom: (state, action) => {
      state.lastZoom = action.payload;
    },
    setFilteredDatasets: (state, action) => {
      state.filteredDatasets = action.payload;
    },
    setPendingLocationCheck: (state, action) => {
      state.pendingLocationCheck = action.payload;
    },
    setDatasetIds: (state, action) => {
      state.datasetIds = action.payload;
    },
  },
});

export default slice.reducer;

export const setQuery = (payload: string | null) => ({
  type: 'search/setQuery',
  payload,
});
export const setLocation = (payload: any) => ({
  type: 'search/setLocation',
  payload,
});
export const setLastZoom = (payload: any) => ({
  type: 'search/setLastZoom',
  payload,
});
export const setFilteredDatasets = (payload: Dataset[]) => ({
  type: 'search/setFilteredDatasets',
  payload,
});
export const setPendingLocationCheck = (payload: boolean) => ({
  type: 'search/setPendingLocationCheck',
  payload,
});
export const setDatasetIds = (payload: number[]) => ({
  type: 'search/setDatasetIds',
  payload,
});

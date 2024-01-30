/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import { Dataset } from 'components/common/types';

const slice = createSlice({
  name: 'location',
  initialState: {
    query: null,
    location: null,
    filteredDatasets: null,
    pendingLocationCheck: false,
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setFilteredDatasets: (state, action) => {
      state.filteredDatasets = action.payload;
    },
    setPendingLocationCheck: (state, action) => {
      state.pendingLocationCheck = action.payload;
    },
  },
});

export default slice.reducer;

export const setQuery = (payload: string | null) => ({
  type: 'location/setQuery',
  payload,
});
export const setLocation = (payload: any) => ({
  type: 'location/setLocation',
  payload,
});
export const setFilteredDatasets = (payload: Dataset[]) => ({
  type: 'location/setFilteredDatasets',
  payload,
});
export const setPendingLocationCheck = (payload: boolean) => ({
  type: 'location/setPendingLocationCheck',
  payload,
});

import { createSlice } from '@reduxjs/toolkit';
import { Dataset } from 'components/common/types';

const slice = createSlice({
  name: 'location',
  initialState: {
    query: null,
    // TODO: rename as result?
    response: null,
    filteredDatasets: null,
    pendingLocationCheck: false,
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setResponse: (state, action) => {
      state.response = action.payload;
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
export const setResponse = (payload: any) => ({
  type: 'location/setResponse',
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

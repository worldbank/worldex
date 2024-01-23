import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'location',
  initialState: {
    query: null,
    // TODO: rename as result?
    response: null,
    filteredDatasets: null,
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
export const setFilteredDatasets = (payload: any) => ({
  type: 'location/setFilteredDatasets',
  payload,
});

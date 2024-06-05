/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'search',
  initialState: {
    query: null,
    location: null,
    lastZoom: null,
    pendingLocationCheck: false,
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
    setPendingLocationCheck: (state, action) => {
      state.pendingLocationCheck = action.payload;
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
export const setPendingLocationCheck = (payload: boolean) => ({
  type: 'search/setPendingLocationCheck',
  payload,
});

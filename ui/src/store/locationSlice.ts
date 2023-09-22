import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'location',
  initialState: {
    query: null,
    response: null,
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setResponse: (state, action) => {
      state.response = action.payload;
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

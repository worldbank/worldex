import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'selected',
  initialState: {
    h3Index: null,
    datasets: null,
  },
  reducers: {
    setH3Index: (state, action) => {
      state.h3Index = action.payload;
    },
    setDatasets: (state, action) => {
      state.datasets = action.payload;
    },
  },
});

export default slice.reducer;

export const setH3Index = (payload: string | null) => ({
  type: 'selected/setH3Index',
  payload,
});
export const setDatasets = (payload: any[]) => ({
  type: 'selected/setDatasets',
  payload,
});

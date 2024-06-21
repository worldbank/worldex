/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';
import { Entity } from 'components/common/types';

const initialState: any = {
  // query: null,
  location: null,
  lastZoom: null,
  pendingLocationCheck: false,
  chippedEntities: [],
  // consider moving datasets here
};

const slice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // setQuery: (state, action) => {
    //   state.query = action.payload;
    // },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setLastZoom: (state, action) => {
      state.lastZoom = action.payload;
    },
    setPendingLocationCheck: (state, action) => {
      state.pendingLocationCheck = action.payload;
    },
    setChippedEntities: (state, action) => {
      state.chippedEntities = [...action.payload];
    },
    appendChippedEntities: (state, action) => {
      state.chippedEntities = [...state.chippedEntities, ...action.payload];
    },
    removeChippedEntityByLabel: (state, action) => {
      const labels = action.payload;
      console.log(labels);
      state.chippedEntities = state.chippedEntities.filter((ce: Entity) => !labels.includes(ce.label));
    },
    resetByKey: (state, action) => {
      action.payload.forEach((key: string) => {
        state[key] = initialState[key];
      });
    },
  },
});

export default slice.reducer;

// export const setQuery = (payload: string | null) => ({
//   type: 'search/setQuery',
//   payload,
// });
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
export const setChippedEntities = (...payload: Entity[]) => ({
  type: 'search/setChippedEntities',
  payload,
});
export const appendChippedEntities = (...payload: Entity[]) => ({
  type: 'search/appendChippedEntities',
  payload,
});
export const removeChippedEntityByLabel = (...payload: string[]) => ({
  type: 'search/removeChippedEntityByLabel',
  payload,
});
export const resetByKey = (...payload: string[]) => ({
  type: 'search/resetByKey',
  payload,
});

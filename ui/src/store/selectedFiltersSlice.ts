import { createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from './store';

const slice = createSlice({
  name: 'selectedFilters',
  initialState: {
    sourceOrgs: {},
  },

  reducers: {
    setSourceOrgs: (state, action) => {
      state.sourceOrgs = action.payload;
    //   // console.log(action.payload);
    //   // If you need to pass a function with previous state,
    //   // you can call it here and pass the previous state as an argument
    //   // const newState = action.payload(state.sourceOrgs); // Calling function with previous state
    //   return { ...state, value: newState };
    },
    updateSourceOrgs: (state, action) => {
      state.sourceOrgs = {
        ...state.sourceOrgs,
        ...action.payload,
      };
    },
  },
});

export default slice.reducer;

export const setSourceOrgs = (payload: string[]) => ({
  type: 'selectedFilters/setSourceOrgs',
  payload,
});

export const updateSourceOrgs = (payload: { [x: string]: boolean; }) => ({
  type: 'selectedFilters/updateSourceOrgs',
  payload,
});

export const selectSourceOrgFilters = createSelector(
  (state: RootState) => state.selectedFilters.sourceOrgs,
  (sourceOrgs) => {
    if (sourceOrgs == null || Object.keys(sourceOrgs).length === 0) {
      return [];
    }
    const selectedSourceOrgs = Object.keys(sourceOrgs).filter(
      (sourceOrg: string) => sourceOrgs[sourceOrg] === true,
    );
    return selectedSourceOrgs;
  },
);

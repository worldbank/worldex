import { createSelector, createSlice } from '@reduxjs/toolkit';
import { Dataset } from 'components/common/types';
import { RootState } from './store';

const initialState: any = {
  sourceOrgs: {},
  accessibilities: {},
  datasetIds: [],
  h3IndexedDatasets: [],
};

const slice = createSlice({
  name: 'selectedFilters',
  initialState,
  reducers: {
    setSourceOrgs: (state, action) => {
      state.sourceOrgs = action.payload;
    },
    updateSourceOrgs: (state, action) => {
      state.sourceOrgs = {
        ...state.sourceOrgs,
        ...action.payload,
      };
    },
    setAccessibilities: (state, action) => {
      state.accessibilities = action.payload;
    },
    updateAccessibilities: (state, action) => {
      state.accessibilities = {
        ...state.accessibilities,
        ...action.payload,
      };
    },
    // move this elsewhere
    setH3IndexedDatasets: (state, action) => {
      state.h3IndexedDatasets = action.payload;
    },
    resetByKey: (state, action) => {
      action.payload.forEach((key: string) => {
        state[key] = initialState[key];
      });
    },
  },
});

export default slice.reducer;

export const setSourceOrgs = (payload: { [x: string]: boolean; }) => ({
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

export const setAccessibilities = (payload: { [x: string]: boolean; }) => ({
  type: 'selectedFilters/setAccessibilities',
  payload,
});

export const updateAcccessibilities = (payload: { [x: string]: boolean; }) => ({
  type: 'selectedFilters/updateAccessibilities',
  payload,
});

export const selectAccessibilities = createSelector(
  (state: RootState) => state.selectedFilters.accessibilities,
  (accessibilities) => {
    if (accessibilities == null || Object.keys(accessibilities).length === 0) {
      return [];
    }
    const selectedAccessibilities = Object.keys(accessibilities).filter(
      (a11y: string) => accessibilities[a11y] === true,
    );
    return selectedAccessibilities;
  },
);

export const setH3IndexedDatasets = (payload: Dataset[]) => ({
  type: 'selectedFilters/setH3IndexedDatasets',
  payload,
});

export const resetByKey = (...payload: string[]) => ({
  type: 'selectedFilters/resetByKey',
  payload,
});

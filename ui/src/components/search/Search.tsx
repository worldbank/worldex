import { setViewState } from '@carto/react-redux';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete, CircularProgress, IconButton, TextField,
} from '@mui/material';
import booleanWithin from '@turf/boolean-within';
import { multiPolygon, point, polygon } from '@turf/helpers';
import axios from 'axios';
import { Dataset, Entity } from 'components/common/types';
import { cellToLatLng, getResolution } from 'h3-js';
import isEqual from 'lodash.isequal';
import isEqualWith from 'lodash.isequalwith';
import uniqWith from 'lodash.uniqwith';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  resetByKey as resetPreviewByKey,
} from 'store/previewSlice';
import {
  resetByKey as resetSearchByKey,
  setLastZoom,
  setLocation,
  setPendingLocationCheck,
} from 'store/searchSlice';
import {
  resetByKey as resetSelectedFiltersByKey,
  selectAccessibilities,
  selectSourceOrgFilters,
} from 'store/selectedFiltersSlice';
import {
  resetByKey as resetSelectedByKey,
  setDatasets,
} from 'store/selectedSlice';
import { RootState } from 'store/store';
import getSteppedZoomResolutionPair from 'utils/getSteppedZoomResolutionPair';
import moveViewportToBbox from 'utils/moveViewportToBbox';
import { deselectTile, getDatasetsByKeyword, prepSearchKeyword } from './utils';

function SearchButton({ isLoading, disabled }: { isLoading: boolean, disabled?: boolean }) {
  return (
    <div className="flex justify-center items-center w-[2em] mr-[-8px]">
      {
      isLoading ? <CircularProgress size="1em" /> : (
        <IconButton aria-label="search" type="submit" disabled={disabled}>
          <SearchIcon />
        </IconButton>
      )
    }
    </div>
  );
}

function ClearButton() {
  return (
    <div className="flex justify-center items-center w-[2em] mr-[-8px]">
      <IconButton arial-label="clear" type="reset">
        <ClearIcon />
      </IconButton>
    </div>
  );
}

function Search({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [entities, setEntities] = useState([] as Entity[]);
  const [keywordPayload, setKeywordPayload] = useState({});

  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const { location, lastZoom } = useSelector((state: RootState) => state.search);
  const { h3Index: selectedH3Index }: { h3Index: string } = useSelector((state: RootState) => state.selected);
  const sourceOrgs = useSelector(selectSourceOrgFilters);
  const accessibilities = useSelector(selectAccessibilities);

  const dispatch = useDispatch();

  const getSetDatasets = async ({ location, zoom, candidateDatasets = null }: { location: any, zoom: number, candidateDatasets?: Dataset[] }) => {
    // TODO: make this single purpose. lessen side effects and simply return datasets
    const [_, resolution] = getSteppedZoomResolutionPair(zoom);
    const body: any = {
      location: JSON.stringify(location.geojson),
      resolution,
    };
    const isValidCandidateDatasets = Array.isArray(candidateDatasets) && candidateDatasets.length > 0;
    const candidateDatasetIds = isValidCandidateDatasets ? candidateDatasets.map((d: Dataset) => d.id) : null;

    if (Array.isArray(candidateDatasetIds) && candidateDatasetIds.length > 0) {
      body.dataset_ids = candidateDatasetIds;
    } else {
      body.source_org = sourceOrgs;
      body.accessibility = accessibilities;
    }
    const { data: datasetsResults } = await axios.post(
      `${import.meta.env.VITE_API_URL}/datasets_by_location/`,
      body,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );
    if (!Array.isArray(datasetsResults) || datasetsResults.length === 0) {
      return;
    }
    const datasetsResultsIds = datasetsResults.map((d: Dataset) => d.id);
    const finalDatasets = isValidCandidateDatasets ? candidateDatasets.filter((cd: Dataset) => datasetsResultsIds.includes(cd.id)) : datasetsResults;
    dispatch(setDatasets(finalDatasets));
    dispatch(setPendingLocationCheck(true));
    if (selectedH3Index) {
      deselectTile(selectedH3Index, resolution, location, dispatch);
    }
    return finalDatasets;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    console.group(`Performing search: ${query}`);

    try {
      let entities = [] as Entity[];
      try {
        const { data: parseResults } = await axios.get(
          `${import.meta.env.VITE_API_URL}/search/parse`,
          { params: { query }, timeout: 6000 },
        );
        entities = parseResults.entities;
        setEntities(entities);
        console.info(Array.isArray(entities) && entities.length > 0 ? 'Entities found' : 'No entities found', entities);
      } catch (err) {
        console.error(err.toJSON());
      }

      const keywordPayload_: any = {
        query,
        size: 10000,
        source_org: sourceOrgs,
        accessibility: accessibilities,
      };

      const yearEntity = entities.find((e: Entity) => e.label === 'year');
      const regionEntity = entities.find((e: Entity) => e.label === 'region');
      const countryEntity = entities.find((e: Entity) => e.label === 'country');
      const hasLocationEntity = regionEntity || countryEntity;
      if (yearEntity) {
        keywordPayload_.min_year = yearEntity.text;
        keywordPayload_.max_year = yearEntity.text;
      }

      let labelsToKeep = ['statistical indicator'] as string[];
      setKeywordPayload(keywordPayload_);
      if (hasLocationEntity || entities.length === 0) {
        const locationQ = (
          hasLocationEntity
            ? [regionEntity?.text, countryEntity?.text].filter((e: string) => e).join(',')
            : query
        );
        console.info(`Querying nominatim: ${locationQ}`);
        const { data: nominatimResults } = await axios.get(
          'https://nominatim.openstreetmap.org/search',
          {
            params: {
              q: locationQ,
              format: 'json',
              polygon_geojson: 1,
            },
          },
        );
        if (Array.isArray(nominatimResults) && nominatimResults.length > 0) {
          const dedupedResults = uniqWith(
            nominatimResults,
            (result: any, other: any) => isEqualWith(result, other, (result: any, other: any) => isEqual(result.geojson.coordinates, other.geojson.coordinates)),
          );
          setOptions([{ display_name: 'Skip geography filtering', name: 'Skip geography filtering', skip: true }, ...dedupedResults]);
          console.info('Display nominatim results');
          return;
        } else {
          console.info('No nominatim results');
          labelsToKeep = ['statistical indicator', 'region', 'country'];
        }
      }

      keywordPayload_.query = await prepSearchKeyword(query, entities, labelsToKeep);
      console.info('Search by keyword:', keywordPayload_.query);
      const { hits: datasets } = await getDatasetsByKeyword(keywordPayload_);
      if (Array.isArray(datasets) && datasets.length === 0) {
        const msg = 'No dataset results';
        console.info(msg);
        setError(msg);
      } else {
        dispatch(resetSelectedByKey('selectedDataset', 'h3Index'));
        dispatch(resetSearchByKey('location', 'lastZoom'));
        console.info('Displaying datasets');
        dispatch(setDatasets(datasets));
        // @ts-ignore
        dispatch(setViewState({ latitude: 0, longitude: 0, zoom: 2 }));
      }
    } catch (err) {
      console.error(err.toJSON());
    } finally {
      setIsLoading(false);
    }
    console.groupEnd();
  };

  const selectLocation = async (event: React.ChangeEvent<HTMLInputElement>, location: any | null) => {
    // will only be called if there are nominatim results
    setIsLoading(true);

    const hasNoEntities = Array.isArray(entities) && entities.length === 0;
    const keyword = hasNoEntities ? query : await prepSearchKeyword(query, entities, location.skip ? ['statistical indicator', 'region', 'country'] : ['statistical indicator']);
    let candidateDatasets = [] as Dataset[];

    const selectedLocationFromRawQuery = hasNoEntities && !location.skip;
    if (keyword && !selectedLocationFromRawQuery) {
      console.info('Search by keyword:', keyword);
      const { hits } = await getDatasetsByKeyword({ ...keywordPayload, query: keyword });
      if (hits.length === 0) {
        // there's no candidate datasets to location-filter
        console.info('No dataset results; location filtering unnecessary');
        setError('No dataset results');
        setIsLoading(false);
        console.groupEnd();
        return;
      }
      candidateDatasets = hits;
    } else {
      console.info('Skipping keyword search');
    }

    dispatch(resetSelectedByKey('selectedDataset', 'h3Index'));
    dispatch(resetSearchByKey('location', 'lastZoom'));

    if (location.skip) {
      console.info('Skip location filtering; display datasets');
      dispatch(setDatasets(candidateDatasets));
      // temporary ux hack: reset map view for faster load time
      // instead of flying to the first ranked dataset
      // @ts-ignore
      dispatch(setViewState({ latitude: 0, longitude: 0, zoom: 2 }));
    } else {
      const [minLat, maxLat, minLon, maxLon] = location.boundingbox.map(parseFloat);
      const bbox = {
        minLat, maxLat, minLon, maxLon,
      };
      const { zoom } = moveViewportToBbox(bbox, viewState, dispatch, true);
      if (['Polygon', 'MultiPolygon'].includes(location.geojson.type)) {
        console.info('Filter by location', location);
        const datasets = await getSetDatasets({ location, zoom, candidateDatasets });
        if (Array.isArray(datasets) && datasets.length > 0) {
          console.info('Display datasets');
          dispatch(setLocation(location));
          moveViewportToBbox(bbox, viewState, dispatch);
          dispatch(setLastZoom(zoom));
        } else {
          const message = 'No dataset results';
          console.info(message);
          setError(message);
        }
      }
    }
    setIsLoading(false);
    console.groupEnd();
  };

  const resetSearch = () => {
    setEntities([]);
    setQuery('');
    setError('');
    setOptions([]);
    dispatch(resetPreviewByKey('fileUrl', 'isLoadingPreview', 'errorMessage'));
    dispatch(resetSearchByKey('location', 'lastZoom'));
    dispatch(resetSelectedByKey('datasets'));
    dispatch(resetSelectedFiltersByKey('datasetIds', 'h3IndexedDatasets'));
  };

  useEffect(() => {
    if (location && lastZoom) {
      getSetDatasets({ location, zoom: lastZoom });
    }
  }, [sourceOrgs, accessibilities]);

  // use Autocomplete as the base component since it conveniently
  // combines free text search and dropdown functionalities

  return (
    <form className={`w-full ${className}`} onSubmit={handleSubmit} onReset={resetSearch}>
      <Autocomplete
        id="location-search"
        options={options}
        // disable filtering based on substring matching; simply use all of nominatim's results
        filterOptions={(options, state) => options}
        getOptionLabel={(option) => option.display_name || option.name}
        isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
        inputValue={query}
        onChange={selectLocation}
        renderInput={(params) => (
          <TextField
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...params}
            label="Search for datasets"
            error={!!error}
            helperText={error}
            variant="outlined"
            value={query}
            onChange={
              (event: React.ChangeEvent<HTMLInputElement>) => {
                setError('');
                setQuery(event.target.value);
              }
            }
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  <SearchButton isLoading={isLoading} disabled={query.trim() === ''} />
                  <ClearButton />
                </>
              ),
            }}
          />
        )}
        // disable popup and clear to reclaim their reserved space
        // custom behavior is used in their place
        forcePopupIcon={false}
        disableClearable
        // prevent the 'No options' notice from showing
        // while the user is still inputting their query
        open={options.length > 0}
        openOnFocus={false}
        onClose={(event: React.SyntheticEvent, reason: string) => { setOptions([]); }}
      />
    </form>
  );
}

export default Search;

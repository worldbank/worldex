import { setViewState } from '@carto/react-redux';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete, CircularProgress, IconButton, TextField,
} from '@mui/material';
import booleanWithin from '@turf/boolean-within';
import { multiPolygon, point, polygon } from '@turf/helpers';
import axios from 'axios';
import { Dataset } from 'components/common/types';
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
  setDatasetIds,
} from 'store/selectedFiltersSlice';
import {
  resetByKey as resetSelectedByKey,
  setDatasets,
} from 'store/selectedSlice';
import { RootState } from 'store/store';
import getSteppedZoomResolutionPair from 'utils/getSteppedZoomResolutionPair';
import moveViewportToBbox from 'utils/moveViewportToBbox';

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
  const [entities, setEntities] = useState([]);
  const [keywordPayload, setKeywordPayload] = useState({});

  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const { location, lastZoom } = useSelector((state: RootState) => state.search);
  const { h3Index: selectedH3Index }: { h3Index: string } = useSelector((state: RootState) => state.selected);
  const sourceOrgs = useSelector(selectSourceOrgFilters);
  const accessibilities = useSelector(selectAccessibilities);

  const dispatch = useDispatch();

  const getDatasets = async ({ location, zoom, datasetIds }: { location: any, zoom: number, datasetIds?: number[] }) => {
    // TODO: make this single purpose. lessen side effects and simply return datasets
    const [_, resolution] = getSteppedZoomResolutionPair(zoom);
    const body: any = {
      location: JSON.stringify(location.geojson),
      resolution,
    };
    if (Array.isArray(datasetIds) && datasetIds.length > 0) {
      body.dataset_ids = datasetIds;
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
    if (Array.isArray(datasetsResults) && datasetsResults.length > 0) {
      dispatch(setDatasets(datasetsResults));
    } else {
      setError('No dataset results');
      return;
    }

    dispatch(setPendingLocationCheck(true));
    if (selectedH3Index) {
      // deselect current tile if it's not among the tiles rendered inside the location feature
      const locationFeature = (location.geojson.type === 'Polygon' ? polygon : multiPolygon)(location.geojson.coordinates);
      const selectedTilePoint = point(cellToLatLng(selectedH3Index).reverse());
      if (getResolution(selectedH3Index) !== resolution || !booleanWithin(selectedTilePoint, locationFeature)) {
        dispatch(resetSelectedByKey('h3Index'));
      }
    }
    return datasetsResults;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let entities: any[] = [];
      try {
        const { data: parseResults } = await axios.get(
          `${import.meta.env.VITE_API_URL}/search/parse`,
          { params: { query }, timeout: 6000 },
        );
        entities = parseResults.entities;
        setEntities(entities);
      } catch (err) {
        console.error(err.toJSON());
      }

      const keywordPayload_: any = {
        query,
        size: 999,
        source_org: sourceOrgs,
        accessibility: accessibilities,
      };

      const yearEntity = entities.find((e: any) => e.label === 'year');
      const regionEntity = entities.find((e: any) => e.label === 'region');
      const countryEntity = entities.find((e: any) => e.label === 'country');
      if (yearEntity) {
        keywordPayload_.min_year = yearEntity.text;
        keywordPayload_.max_year = yearEntity.text;
      }

      setKeywordPayload(keywordPayload_);
      if (regionEntity || countryEntity || entities.length === 0) {
        let locationQ;
        if (regionEntity || countryEntity) {
          locationQ = [regionEntity?.text, countryEntity?.text].filter((e: string) => e).join(',');
        } else {
          locationQ = query;
        }
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
          return;
        }
      }

      setIsLoading(true);
      const entitiesToStrip = entities.filter((e) => !['year'].includes(e.label));
      keywordPayload_.query = stripEntities(query, entitiesToStrip);
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/search/strip_stop_words`,
          { params: { query: keywordPayload_.query } },
        );
        const { tokens } = data;
        keywordPayload_.query = tokens.map((t: any) => t.token).join(' ');
      } catch (err) {
        console.error(err.toJSON());
      }
      const { hits: datasets } = await getDatasetsByKeyword(keywordPayload_);
      if (Array.isArray(datasets) && datasets.length === 0) {
        setError('No dataset results');
      } else {
        dispatch(resetSelectedByKey('selectedDataset', 'h3Index'));
        dispatch(resetSearchByKey('location', 'lastZoom'));
        dispatch(setDatasetIds(datasets.map((d: Dataset) => d.id)));
        dispatch(setDatasets(datasets));
      }
    } catch (err) {
      console.error(err.toJSON());
    } finally {
      setIsLoading(false);
    }
  };

  const getDatasetsByKeyword = async (params?: any) => {
    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/search/keyword`,
      { params: params ?? keywordPayload },
    );
    return data;
  };

  const stripEntities = (query: string, entities: any[]): string => {
    if (!Array.isArray(entities) || entities.length === 0) {
      return query;
    }
    let strippedQ = '';
    entities.forEach((entity, idx) => {
      const prevEntity = entities[idx - 1];
      const nextEntity = entities[idx + 1];
      if (!prevEntity) {
        strippedQ += query.slice(0, entity.start);
      } else {
        strippedQ += query.slice(prevEntity.end, entity.start);
      }
      if (!nextEntity) {
        strippedQ += query.slice(entity.end);
      }
    });
    return strippedQ.trim();
  };

  const selectLocation = async (event: React.ChangeEvent<HTMLInputElement>, location: any | null) => {
    setIsLoading(true);
    const hasNoEntities = Array.isArray(entities) && entities.length === 0;
    let params = keywordPayload;

    console.info('Location skipped?', location.skip);
    let keywordQ;
    if (hasNoEntities) {
      console.info('No entities');
      keywordQ = query;
    } else {
      let labelWhitelist = ['statistical indicator'];
      if (location.skip) {
        labelWhitelist = [...labelWhitelist, 'region', 'country'];
      }
      const entitiesToStrip = entities.filter((e) => !labelWhitelist.includes(e.label));
      keywordQ = stripEntities(query, entitiesToStrip);
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/search/strip_stop_words`,
          { params: { query: keywordQ } },
        );
        const { tokens } = data;
        keywordQ = tokens.map((t: any) => t.token).join(' ');
      } catch (err) {
        console.error(err.toJSON());
      }
    }

    let [candidateDatasets, candidateDatasetIds] = [[] as any[], [] as number[]];

    if (keywordQ) {
      // TODO: consider skipping keyword search if
      // entity-stripped keyword query only has stop words left
      params = { ...keywordPayload, query: keywordQ };
      const { hits } = await getDatasetsByKeyword(params);
      candidateDatasets = hits;
      if (candidateDatasets.length === 0) {
        setError('No dataset results');
        setIsLoading(false);
        return;
      }
      candidateDatasetIds = candidateDatasets ? candidateDatasets.map((d: Dataset) => d.id) : null;
    }

    dispatch(resetSelectedByKey('selectedDataset', 'h3Index'));
    dispatch(resetSearchByKey('location', 'lastZoom'));

    if (location.skip) {
      dispatch(setDatasetIds(candidateDatasetIds));
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
        const datasets = await getDatasets({ location, zoom, datasetIds: candidateDatasetIds });
        if (Array.isArray(datasets) && datasets.length > 0) {
          dispatch(setLocation(location));
          moveViewportToBbox(bbox, viewState, dispatch);
          dispatch(setLastZoom(zoom));
        }
      }
    }
    setIsLoading(false);
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
      getDatasets({ location, zoom: lastZoom });
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

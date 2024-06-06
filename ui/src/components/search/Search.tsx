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

function SearchButton({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex justify-center items-center w-[2em] mr-[-8px]">
      {
      isLoading ? <CircularProgress size="1em" /> : (
        <IconButton aria-label="search" type="submit">
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
  // const [strippedQuery ,setStrippedQuery] = useState('');
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
    if (datasetsResults) {
      dispatch(setDatasets(datasetsResults));
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
      // consider single pass
      const statIndicatorEntity = entities.find((e: any) => e.label === 'statistical indicator');
      if (statIndicatorEntity) {
        keywordPayload_.query = statIndicatorEntity.text;
      }
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
    console.log('getting datasets');
    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/search/keyword`,
      { params: params ?? keywordPayload },
    );
    return data;
  };

  const stripEntities = (query: string, entities: any[]): string => {
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
    return strippedQ;
  };

  const selectLocation = async (event: React.ChangeEvent<HTMLInputElement>, location: any | null) => {
    const hasStatIndicator = entities.some((e) => e.label === 'statistical indicator');

    const hasNoEntities = Array.isArray(entities) && entities.length === 0;
    const statIndicatorEntity = entities.find((e: any) => e.label === 'statistical indicator');
    const regionEntity = entities.find((e: any) => e.label === 'region');
    const countryEntity = entities.find((e: any) => e.label === 'country');

    let fetched = false;
    let candidateDatasets;
    let params = keywordPayload;
    if (location.skip) {
      let keywordQ;
      if (hasNoEntities) {
        keywordQ = query;
      } else {
        keywordQ = [regionEntity?.text, countryEntity?.text].filter((e: string) => e).join(',');
        if (hasStatIndicator) {
          keywordQ += `,${statIndicatorEntity.text}`;
        }
      }
      params = { ...keywordPayload, query: keywordQ };
      const { hits } = await getDatasetsByKeyword(params);
      candidateDatasets = hits;
      fetched = true;
    } else {
      // eslint-disable-next-line no-lonely-if
      if (hasStatIndicator) {
        const { hits } = await getDatasetsByKeyword();
        candidateDatasets = hits;
        fetched = true;
      }
      // do nothing if location is chosen and there's no stat indicator keyword
    }

    const datasetIds = candidateDatasets ? candidateDatasets.map((d: Dataset) => d.id) : null;

    dispatch(resetSelectedByKey('selectedDataset', 'h3Index'));
    dispatch(resetSearchByKey('location', 'lastZoom'));
    dispatch(setDatasetIds(datasetIds));

    if (fetched) {
      if (datasetIds.length === 0) {
        setError('No dataset results');
        return;
      } else if (location.skip) {
        dispatch(setDatasets(candidateDatasets));
        return;
      } else {
        // we fly the map to the first ranked dataset
        if (candidateDatasets[0]?.bbox) {
          const [w, s, e, n] = candidateDatasets[0].bbox;
          const bbox = {
            minLat: s, maxLat: n, minLon: w, maxLon: e,
          };
          moveViewportToBbox(bbox, viewState, dispatch);
        }
        return;
      }
    }

    const [minLat, maxLat, minLon, maxLon] = location.boundingbox.map(parseFloat);
    const bbox = {
      minLat, maxLat, minLon, maxLon,
    };
    dispatch(setLocation(location));
    const { zoom } = moveViewportToBbox(bbox, viewState, dispatch);
    dispatch(setLastZoom(zoom));
    if (['Polygon', 'MultiPolygon'].includes(location.geojson.type)) {
      getDatasets({ location, zoom, datasetIds });
    }
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
                  <SearchButton isLoading={isLoading} />
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

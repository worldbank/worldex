import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete, CircularProgress, IconButton, Paper, TextField,
} from '@mui/material';
import booleanWithin from '@turf/boolean-within';
import { multiPolygon, point, polygon } from '@turf/helpers';
import { cellToLatLng, getResolution } from 'h3-js';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setFilteredDatasets, setLastZoom, setLocation, setPendingLocationCheck,
} from 'store/locationSlice';
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from 'store/store';
import getSteppedZoomResolutionPair from 'utils/getSteppedZoomResolutionPair';
import isEqual from 'lodash.isequal';
import uniqWith from 'lodash.uniqwith';
import isEqualWith from 'lodash.isequalwith';
import moveViewportToBbox from 'utils/moveViewportToBbox';
import { selectAccessibilities, selectSourceOrgFilters } from 'store/selectedFiltersSlice';
import axios, { AxiosError } from 'axios';

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
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch();
  const { h3Index: selectedH3Index }: { h3Index: string } = useSelector((state: RootState) => state.selected);
  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const { location, lastZoom } = useSelector((state: RootState) => state.location);
  const sourceOrgs = useSelector(selectSourceOrgFilters);
  const accessibilities = useSelector(selectAccessibilities);

  const getDatasets = async ({ location, zoom }: { location: any, zoom: number }) => {
    const [_, resolution] = getSteppedZoomResolutionPair(zoom);
    const datasetsResp = await fetch(`${import.meta.env.VITE_API_URL}/datasets_by_location/`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: JSON.stringify(location.geojson),
        resolution,
        source_org: sourceOrgs,
        accessibility: accessibilities,
      }),
    });
    const datasetsResults = await datasetsResp.json();
    if (datasetsResults) {
      dispatch(setFilteredDatasets(datasetsResults));
    }

    dispatch(setPendingLocationCheck(true));
    if (selectedH3Index) {
      // deselect current tile if it's not among the tiles rendered inside the location feature
      const locationFeature = (location.geojson.type === 'Polygon' ? polygon : multiPolygon)(location.geojson.coordinates);
      const selectedTilePoint = point(cellToLatLng(selectedH3Index).reverse());
      if (getResolution(selectedH3Index) !== resolution || !booleanWithin(selectedTilePoint, locationFeature)) {
        dispatch(setSelectedH3Index(null));
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const encodedQuery = new URLSearchParams(query).toString();
    let parseResults;
    let entities;

    try {
      // const { data: parseResults } = await axios.get(`${import.meta.env.VITE_API_URL}/search/parse`, { params: { query: encodedQuery } });
      // entities = parseResults.entities;
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/search/keyword`,
        {
          params: {
            query: encodedQuery,
            size: 999,
          },
        },
      );
      console.log('hits', data.hits);
      dispatch(setDatasets(data.hits));
    } catch (err) {
      console.log(err.toJSON());
    } finally {
      setIsLoading(false);
    }

    // console.log(parseResults);
    // let encodedNominatimQ;
    // // location
    // // if empty entities, pass query to nominatim
    // if (Array.isArray(entities) && entities.length === 0) {
    //   const resp = await fetch(
    //     `https://nominatim.openstreetmap.org/search?q=${encodedNominatimQ || encodedQuery}&format=json&polygon_geojson=1`,
    //   );
    //   const results = await resp.json();
    // }

    // if (Array.isArray(entities) && entities.length > 0) {
    //   let locEntityIndex = entities.findIndex((entity) => entity.label === 'region');
    //   if (locEntityIndex === -1) {
    //     locEntityIndex = entities.findIndex((entity) => entity.label === 'country');
    //   }
    //   if (locEntityIndex !== -1) {
    //     const locationEntity = entities[locEntityIndex];
    //     entities.splice(locEntityIndex, 1);
    //     // consider normalized[0]['name']
    //     encodedNominatimQ = new URLSearchParams(locationEntity.text).toString();
    //   }

    //   // get dataset ids
    //   if (entities.length > 0) {
    //     // pass encoded location to nominatim
    //   } else {
    //     console.log();
    //   }
    // }
    // console.log(parseResults);
    // TODO: if no entities at all - pass raw query to nominatim
    // const nominatimResp = await fetch(
    //   `https://nominatim.openstreetmap.org/search?q=${encodedNominatimQ || encodedQuery}&format=json&polygon_geojson=1`,
    // );
    // const nominatimResults = await nominatimResp.json();
    // if (nominatimResults == null || nominatimResults.length === 0) {
    //   // push to keyword instead
    //   setIsError(true);
    //   const { data: keywordResp } = await axios.get(
    //     `${import.meta.env.VITE_API_URL}/search/keyword?query=${encodedQuery}&size=999`,
    //     {
    //       params: {
    //         query: encodedQuery,
    //         size: 999,
    //         // min_year: ,
    //         // max_year ,
    //         // accessibility: ,
    //         // source_orgs: ,
    //       },
    //     },
    //   );
    //   const keywordResults = await keywordResp.json();
    //   console.log(keywordResults);
    // } else {
    //   const dedupedResults = uniqWith(nominatimResults, (result: any, other: any) => isEqualWith(result, other, (result: any, other: any) => isEqual(result.geojson.coordinates, other.geojson.coordinates)));
    //   setOptions(dedupedResults);
    // }
    setIsLoading(false);
  };

  const selectLocation = (event: React.ChangeEvent<HTMLInputElement>, location: any | null) => {
    setQuery(location.display_name || location.option.name);

    const [minLat, maxLat, minLon, maxLon] = location.boundingbox.map(parseFloat);
    const bbox = {
      minLat, maxLat, minLon, maxLon,
    };
    dispatch(setLocation(location));
    const { zoom } = moveViewportToBbox(bbox, viewState, dispatch);
    dispatch(setLastZoom(zoom));
    if (['Polygon', 'MultiPolygon'].includes(location.geojson.type)) {
      getDatasets({ location, zoom });
    }
  };

  const clearLocation = () => {
    setQuery('');
    setIsError(false);
    setOptions([]);
    dispatch(setLocation(null));
    dispatch(setLastZoom(null));
    dispatch(setFilteredDatasets(null));
  };

  useEffect(() => {
    if (location && lastZoom) {
      getDatasets({ location, zoom: lastZoom });
    }
  }, [sourceOrgs, accessibilities]);

  // use Autocomplete as the base component since it conveniently
  // combines free text search and dropdown functionalities

  return (
    <form className={`w-full ${className}`} onSubmit={handleSubmit} onReset={clearLocation}>
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
            error={isError}
            helperText={isError && 'No results.'}
            // label="Search"
            variant="outlined"
            value={query}
            onChange={
              (event: React.ChangeEvent<HTMLInputElement>) => {
                setIsError(false);
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

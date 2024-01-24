import { setViewState } from '@carto/react-redux';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { CircularProgress, IconButton, Paper, TextField } from "@mui/material";
import booleanWithin from "@turf/boolean-within";
import { multiPolygon, point, polygon } from "@turf/helpers";
import { ZOOM_H3_RESOLUTION_PAIRS } from "constants/h3";
import { cellToLatLng, getResolution } from "h3-js";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFilteredDatasets, setResponse as setLocationResponse } from 'store/locationSlice';
import { setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from "store/store";
import bboxToViewStateParams from 'utils/bboxToViewStateParams';

const SearchButton = ({isLoading}: {isLoading: boolean}) =>
  <div className="flex justify-center items-center w-[2em] mr-[-8px]">
    {
      isLoading ? <CircularProgress size="1em" /> : (
        <IconButton aria-label="search" type="submit">
          <SearchIcon />
        </IconButton>
      )
    }
  </div>

const ClearButton = () =>
  <div className="flex justify-center items-center w-[2em] mr-[-8px]">
    <IconButton arial-label="clear" type="reset">
      <ClearIcon />
    </IconButton>
  </div>


const LocationSearch = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch();
  const { h3Index: selectedH3Index }: { h3Index: string } = useSelector((state: RootState) => state.selected);
  const viewState = useSelector((state: RootState) => state.carto.viewState);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true);
    const encodedQuery = new URLSearchParams(query).toString()
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&polygon_geojson`,
    );
    const results = await resp.json();
    if (results == null || results.length === 0) {
      setIsError(true);
    } else {
      const result = results[0];
      const [ minLat, maxLat, minLon, maxLon ] = result.boundingbox.map(parseFloat);
      const bbox = { minLat, maxLat, minLon, maxLon };
      dispatch(setLocationResponse(result));
      const { width, height } = viewState;
      const viewStateParams = bboxToViewStateParams({ bbox, width, height });
      const { zoom } = viewStateParams;
      dispatch(setH3IndexPresent(false));
      // @ts-ignore
      dispatch(setViewState({...viewState, ...viewStateParams }));
      
      if (result && ['Polygon', 'MultiPolygon'].includes(result.geojson.type)) {
        // TODO: put into a function
        const [_, resolution] = (() => {
          for (const [idx, [z, _]] of ZOOM_H3_RESOLUTION_PAIRS.entries()) {
            if (z === zoom) {
              return ZOOM_H3_RESOLUTION_PAIRS[idx];
            } else if (z > zoom) {
              return ZOOM_H3_RESOLUTION_PAIRS[idx - 1];
            }
          }
          return ZOOM_H3_RESOLUTION_PAIRS.at(-1);
        })();
        const datasetsResp = await fetch('/api/datasets_by_location/', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location: JSON.stringify(result.geojson),
            resolution,
          })
        });
        const datasetsResults = await datasetsResp.json();
        if (datasetsResults) {
          dispatch(setFilteredDatasets(datasetsResults));
        }
        
        if (selectedH3Index) {
          // deselect the current tile if it's among the tiles rendered inside the location feature
          const locationFeature = result.geojson.type === 'Polygon' ? polygon(result.geojson.coordinates) : multiPolygon(result.geojson.coordinates);
          const selectedTilePoint = point(cellToLatLng(selectedH3Index).reverse());
          if (getResolution(selectedH3Index) != resolution || !booleanWithin(selectedTilePoint, locationFeature)) {
            dispatch(setSelectedH3Index(null));
          }
        }
      }
    }
    setIsLoading(false);
  }

  const clearLocation = () => {
    setQuery("");
    setIsError(false);
    dispatch(setLocationResponse(null));
    dispatch(setFilteredDatasets(null));
  }

  return (
    <Paper className={className}>
      <div className="flex items-end">
        <form onSubmit={handleSubmit} onReset={clearLocation}>
          <TextField
            error={isError}
            helperText={isError && "No results."}
            label="Search Location"
            variant="outlined"
            value={query}
            onChange={
              (event: React.ChangeEvent<HTMLInputElement>) => {
                setIsError(false);
                setQuery(event.target.value);
              }
            }
            InputProps={{
              // @ts-ignore
              endAdornment: (
                <>
                  <SearchButton isLoading={isLoading} />
                  <ClearButton />
                </>
              ),
              className: "pr-0.5"
            }}
          />
        </form>
      </div>
    </Paper>
  )
}

export default LocationSearch;

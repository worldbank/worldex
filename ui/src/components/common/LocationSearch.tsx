import { CircularProgress, IconButton, Paper, TextField } from "@mui/material"
import SearchIcon from '@mui/icons-material/Search';
import React, { MouseEventHandler, useState } from "react";
import { setViewState } from '@carto/react-redux';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import { WebMercatorViewport } from '@deck.gl/core/typed';

const searchButton = ({isLoading, handleSubmit}: {isLoading: boolean, handleSubmit: React.MouseEventHandler<HTMLButtonElement>}) =>
  <div className="flex justify-center items-center w-[2em] mr-[-8px]">
    {
      isLoading ? <CircularProgress size="1.2em" /> : (
        <IconButton aria-label="search" onClick={handleSubmit}>
            <SearchIcon />
        </IconButton>
      )
    }
  </div>

const LocationSearch = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch();
  const viewState = useSelector((state: RootState) => state.carto.viewState);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true);
    const { width, height } = viewState;
    const encodedQuery = new URLSearchParams(query).toString()
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
    );
    const results = await resp.json();
    if (results == null || results.length === 0) {
      setIsError(true);
    } else {
      const result = results[0];
      const [minLat, maxLat, minLon, maxLon] = result.boundingbox;
      const { latitude, longitude, zoom } = new WebMercatorViewport({ width, height }).fitBounds(
          [[parseFloat(minLon), parseFloat(minLat)], [parseFloat(maxLon), parseFloat(maxLat)]], { padding: 200 }
      );
      setQuery(result.display_name || query);
      // @ts-ignore
      dispatch(setViewState({...viewState, latitude, longitude, zoom }));
    }
    setIsLoading(false);
  }

  return (
    <Paper className={className}>
      <div className="flex items-end">
        <form onSubmit={handleSubmit}>
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
              endAdornment: searchButton({ isLoading, handleSubmit }),
              className: "pr-0.5"
            }}
          />
        </form>
      </div>
    </Paper>
  )
}

export default LocationSearch;

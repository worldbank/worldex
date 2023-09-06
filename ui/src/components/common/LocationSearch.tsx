import { CircularProgress, IconButton, Paper, TextField } from "@mui/material"
import SearchIcon from '@mui/icons-material/Search';
import React, { MouseEventHandler, useState } from "react";
import { setViewState } from '@carto/react-redux';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import { WebMercatorViewport } from '@deck.gl/core/typed';

const searchAdornment = ({isLoading, handleClick}: {isLoading: boolean, handleClick: React.MouseEventHandler<HTMLButtonElement>}) =>
  <div className="flex justify-center items-center w-[2em] mr-[-8px]">
    {
      isLoading ? <CircularProgress size="1.2em" /> : (
        <IconButton aria-label="search" onClick={handleClick}>
            <SearchIcon />
        </IconButton>
      )
    }
  </div>

const LocationSearch = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const handleClick = async () => {
    setIsLoading(true);
    const { width, height } = viewState;
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json`,
    );
    const results = await resp.json();
    if (results != null && results.length > 0) {
      const result = results[0];
      const [minLat, maxLat, minLon, maxLon] = result.boundingbox;
      const { latitude, longitude, zoom } = new WebMercatorViewport({ width, height }).fitBounds(
          [[parseFloat(minLon), parseFloat(minLat)], [parseFloat(maxLon), parseFloat(maxLat)]], { padding: 200 }
      );
      // @ts-ignore
      dispatch(setViewState({...viewState, latitude, longitude, zoom }));
    }
    setIsLoading(false);
  }
  return (
    <Paper className={className}>
      <div className="flex items-end">
        <TextField
          label="Search Location"
          variant="outlined"
          value={query}
          onChange={
            (event: React.ChangeEvent<HTMLInputElement>) => {
              setQuery(event.target.value);
            }
          }
          InputProps={{
            endAdornment: searchAdornment({ isLoading, handleClick }),
            className: "pr-0.5"
          }}
        />
      </div>
    </Paper>
  )
}

export default LocationSearch;

import { IconButton, Paper, TextField } from "@mui/material"
import SearchIcon from '@mui/icons-material/Search';
import React, { useState } from "react";
import { setViewState } from '@carto/react-redux';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import { WebMercatorViewport } from '@deck.gl/core/typed';

const LocationSearch = ({ className }: { className?: string }) => {
  const [query, setQuery]= useState("");
  const dispatch = useDispatch();
  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const handleClick = async () => {
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
  }
  return (
    <Paper className={className}>
      <div className="flex items-end">
        <TextField
          label="Location"
          variant="outlined"
          value={query}
          onChange={
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(event.target.value);
            }
          }
        />
        <IconButton aria-label="search" onClick={handleClick}>
          <SearchIcon />
        </IconButton>
      </div>
    </Paper>
  )
}

export default LocationSearch;

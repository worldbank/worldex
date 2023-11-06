import { Box, Typography } from "@mui/material";
import { UNITS, cellArea, edgeLength, getHexagonEdgeLengthAvg } from "h3-js";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

const Selected = () => {
  const { h3Index, datasets } = useSelector((state: RootState) => state.selected);
  return h3Index && (
    <Box>
      <Typography>H3 id selected: {h3Index}</Typography>
      {/* <Typography>
        Average edge length: {edgeLength(h3Index, UNITS.km)} km<sup className="sups">2</sup>
      </Typography> */}
      <Typography>Cell area: {cellArea(h3Index, UNITS.km2).toFixed(2)} km<sup className="sups">2</sup></Typography>
      <Typography>Datasets count: {datasets?.length}</Typography>
    </Box>
  )
} 

export default Selected;
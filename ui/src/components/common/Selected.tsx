import ExpandLess from "@mui/icons-material/ExpandLess";
import { Box, Button, ButtonGroup, Card, CardContent, Collapse, Divider, IconButton, List, ListItem, Stack, Typography } from "@mui/material";
import classNames from "classnames";
import { UNITS, cellArea, getResolution } from "h3-js";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from "store/store";

const Datasets = ({ datasets }: { datasets: any[] }) => (
  <List className="m-0 py-0 max-h-96 overflow-y-auto">
    {
      datasets.map((dataset: any, idx: number) => (
        <div key={dataset.id}>
          <ListItem className="py-2.5">
            <Stack spacing={1}>
              <Typography className="text-sm font-bold">{idx+1}. { dataset.name }</Typography>
              <Typography className="text-xs italic">{ dataset.source_org }</Typography>
              <Typography className="text-xs">{ dataset.description }</Typography>
            </Stack>
          </ListItem>
          <Divider />
        </div>
      ))
    }
  </List>
)

const Selected = () => {
  const { h3Index, datasets } = useSelector((state: RootState) => state.selected);
  const [expanded, setExpanded] = useState(true);
  const dispatch = useDispatch();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleDeselectClick = () => {
    dispatch(setSelectedH3Index(null));
    dispatch(setDatasets(null));
    setExpanded(true);
  }
  
  return h3Index && (
    <Card className="absolute bottom-2.5 right-2.5 w-96">
      <CardContent sx={{ '&:last-child': { pb: 1.5 }}} className="p-0 pt-3">
        <Stack className="px-4" direction="row" alignItems="center" justifyContent="space-between">
          <Typography className="text-lg font-bold">Tile {h3Index}</Typography>
          <ButtonGroup className="flex items-center" size="small">
            <Button onClick={handleDeselectClick} variant="text" className="uppercase">Deselect tile</Button>
            <IconButton className={classNames({"rotate-180": expanded})} onClick={handleExpandClick}><ExpandLess /></IconButton>
          </ButtonGroup>
        </Stack>
        <Collapse in={expanded}>
          <Box className="px-4 pb-2">
            <Typography className="text-sm">Resolution: {getResolution(h3Index)}</Typography>
            <Typography className="text-sm">Cell area: {cellArea(h3Index, UNITS.km2).toFixed(2)} km<sup className="sups">2</sup></Typography>
            <Typography className="text-sm">Dataset count: {datasets?.length} datasets</Typography>
          </Box>
          <Divider />
          { datasets && <Datasets datasets={datasets} />}
        </Collapse>
      </CardContent>
    </Card>
  )
} 

export default Selected;
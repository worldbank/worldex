import ChevronRight from "@mui/icons-material/ChevronRight";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, IconButton, Link, List, ListItem, Popover, Stack, Typography } from "@mui/material";
import classNames from "classnames";
import { UNITS, cellArea, getResolution } from "h3-js";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from "store/store";
import groupBy from "utils/groupBy";
import { Dataset } from "./types";

const DatasetItem = ({idx, dataset}: {idx: number, dataset: Dataset}) => {
  const [anchor, setAnchor] = useState(null);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
  };
  const handleClose = () => {
    setAnchor(null);
  };
  const open = Boolean(anchor);

  return (
    <Stack direction="row" className="p-3 items-center justify-between">
      <Box className="m-0">
        <Typography className="text-sm">{idx+1}. {dataset.name}</Typography>
      </Box>
      <IconButton onClick={handleClick}><ChevronRight /></IconButton>
      <Popover
        key={idx}
        className="p-2"
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <div className="p-4 max-w-lg">
          <Typography className="text-sm">{dataset.description}</Typography>
          <List className="text-xs">
            {
              dataset.files && dataset.files.map((file: string) => (
                <ListItem className="p-0">
                  <Link href={file}>{file}</Link>
                </ListItem>
              ))
            }
          </List>
        </div>
      </Popover>
    </Stack>
  )
}

const Datasets = ({ datasetsByOrgs }: { datasetsByOrgs: { [source_org: string]: Dataset[]; }}) => (
  <div>
    { 
      Object.entries(datasetsByOrgs).map(([org, datasets]) => (
        <Accordion disableGutters elevation={0} key={org} className="!relative">
          <AccordionSummary>
            <Typography className="font-bold">{org}</Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails className="p-0">
            {
              datasets.map((dataset: Dataset, idx: number) => (
                <List className="m-0 py-0 max-h-full overflow-y-auto">
                  <ListItem className="p-0">
                    <Stack className="w-full" spacing={1}>
                      <DatasetItem idx={idx} dataset={dataset} />
                      {idx + 1 < datasets.length && <Divider />}
                    </Stack>
                  </ListItem>
                </List>
              ))
            }
          </AccordionDetails>
        </Accordion>
      ))
    }
  </div>
);

const Selected = () => {
  const { h3Index, datasets }: { h3Index: string, datasets: Dataset[] } = useSelector((state: RootState) => state.selected);
  const dispatch = useDispatch();

  const datasetsByOrgs = datasets ? groupBy(datasets, "source_org") : null;

  const handleDeselectClick = () => {
    dispatch(setSelectedH3Index(null));
    dispatch(setDatasets(null));
  }
  
  return h3Index && (
    <div className="h-full">
      <div className="p-4">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography className="text-lg font-bold">Tile {h3Index}</Typography>
          <Button onClick={handleDeselectClick} size="small" variant="text" className="uppercase">Deselect tile</Button>
        </Stack>
        <Typography className="text-sm">Resolution: {getResolution(h3Index)}</Typography>
        <Typography className="text-sm">Cell area: {cellArea(h3Index, UNITS.km2).toFixed(2)} km<sup className="sups">2</sup></Typography>
        <Typography className="text-sm">Dataset count: {datasets?.length} datasets</Typography>
      </div>
      <Divider />
      { datasets && <Datasets datasetsByOrgs={datasetsByOrgs} />}
    </div>
  )
} 

export default Selected;
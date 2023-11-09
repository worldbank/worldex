import ChevronRight from "@mui/icons-material/ChevronRight";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, IconButton, Link, List, ListItem, Popover, Stack, Typography } from "@mui/material";
import classNames from "classnames";
import { UNITS, cellArea, getResolution } from "h3-js";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from "store/store";
import groupBy from "utils/groupBy";

const DatasetItem = ({idx, dataset}: {idx: number, dataset: any}) => {
  const [anchor, setAnchor] = useState(null);
  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const open = Boolean(anchor);

  return (
    <Stack direction="row" className="p-3 items-center justify-between">
      <Box className="m-0">
        {/* @ts-ignore */}
        <Typography className="text-sm">{idx+1}. { dataset.name }</Typography>
      </Box>
      <IconButton onClick={handleClick}><ChevronRight /></IconButton>
      <Popover
        // id={id}
        className="p-2"
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <div className="p-4">
          <Typography className="max-w-lg text-xs">{dataset.description}</Typography>
          <List>
            {
              dataset.files && dataset.files.map((file: string) => (
                <ListItem className="p-0">
                  <Link className="text-xs text-clip" href={file}>{file.length > 100 ? `${file.slice(0, 50)}...${file.slice(-30)}` : file}</Link>
                </ListItem>
              ))
            }
          </List>
        </div>
      </Popover>
    </Stack>
  )
}

const Datasets = ({ datasetsByOrgs }: { datasetsByOrgs: {[key: string]: any[]} }) => (
  <div>
    { 
      // TODO: type dataset
      Object.entries(datasetsByOrgs).map(([org, datasets]) => {
        return <Accordion disableGutters elevation={0} key={org} className="!relative">
          <AccordionSummary>
            <Typography className="font-bold">{org}</Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails className="p-0">
            {
              datasets.map((dataset: any, idx: number) => {
                return (
                  <List className="m-0 py-0 max-h-[100%] overflow-y-auto">
                    <ListItem className="p-0">
                      <Stack className="w-[100%]" spacing={1}>
                        <DatasetItem idx={idx} dataset={dataset} />
                        {idx + 1 < datasets.length && <Divider />}
                      </Stack>
                    </ListItem>
                  </List>
                )
              })
            }
          </AccordionDetails>
        </Accordion>
      })
    }
  </div>
);

const Selected = () => {
  const { h3Index, datasets } = useSelector((state: RootState) => state.selected);
  const dispatch = useDispatch();

  const datasetsByOrgs = datasets ? groupBy(datasets, "source_org") : null;

  const handleDeselectClick = () => {
    dispatch(setSelectedH3Index(null));
    dispatch(setDatasets(null));
  }
  
  return h3Index && (
    <div className="h-[100%]">
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
import { WebMercatorViewport } from '@deck.gl/core/typed';
import ChevronRight from "@mui/icons-material/ChevronRight";
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, IconButton, Link, List, ListItem, Popover, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { format } from "date-fns";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setViewState } from '@carto/react-redux';
import { setSelectedDataset } from "store/selectedSlice";
import { RootState } from "store/store";
import { Dataset } from "../types";
import classNames from "classnames";


const FilesTable = ({files}: {files: string[]}) => (
  <>
    <Typography className="text-sm">
      <strong>Files:</strong>
    </Typography>
    <TableContainer className="max-w-100 overflow-x-scroll">
      <Table size="small" aria-label="files table">
        <TableBody>
          {files.map((file: string, idx: number) => (
            <TableRow>
              <TableCell className="pl-0">
                <Link href={file} target="_blank">{file}</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </>
)

const DatasetPopover = ({ dataset, anchor, setAnchor }: { dataset: Dataset, anchor: any, setAnchor: any }) => {
  const open = Boolean(anchor);
  const dateFormat = "yyyy MMM d";
  return (
    <Popover
      className="p-2 max-h-[80vh]"
      open={open}
      anchorEl={anchor}
      onClose={() => { setAnchor(null) }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      >
      <div className="p-4 max-w-lg">
        <Typography className="text-sm">{dataset.description}</Typography>
        <div className="py-2">
          {
            (dataset.date_start && dataset.date_end) && (
              <Typography className="text-sm">
                <strong>Date:</strong>
                {` ${format(dataset.date_start, dateFormat)} - ${format(dataset.date_end, dateFormat)}`}
              </Typography>
            )
          }
          <Typography className="text-sm">
            <strong>Accessibility:</strong>{" "}
            <span className="capitalize">{dataset.accessibility}</span>
          </Typography>
          <Typography className="text-sm">
            <strong>Source:</strong>{" "}<Link href={dataset.url} target="_blank" rel="noopener noreferrer">{dataset.url}</Link>
          </Typography>
        </div>
        { dataset.files && <FilesTable files={dataset.files} />}
      </div>
    </Popover>
  )
}

const DatasetItem = ({idx, dataset}: {idx: number, dataset: Dataset}) => {
  const [anchor, setAnchor] = useState(null);
  const { selectedDataset } = useSelector((state: RootState) => state.selected);
  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const { width, height } = viewState;
  const dispatch = useDispatch();
  const toggleVisibility = (datasetId: number, bbox: number[]) => {
    if (anchor) {
      return;
    }
    // TODO: convert into a function
    if (datasetId === selectedDataset) {
      dispatch(setSelectedDataset(null));
      return;
    }
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const { latitude, longitude, zoom } = new WebMercatorViewport({ width, height }).fitBounds(
      [[minLon, minLat], [maxLon, maxLat]], { padding: 50 }
      );
      // @ts-ignore
      dispatch(setViewState({ ...viewState, latitude, longitude, zoom }));
      dispatch(setSelectedDataset(datasetId));
    }
  
  return (
    <Stack
      direction="row"
      className={classNames(
        "p-3",
        "items-center",
        "justify-between",
        "hover:bg-sky-100",
        "cursor-pointer",
        {"bg-sky-100": selectedDataset === dataset.id},
      )}
      onClick={(evt: React.MouseEvent<HTMLElement>) => {
        toggleVisibility(dataset.id, dataset.bbox);
      }}
    >
      <Box className="m-0">
        <Typography className="text-sm">{idx+1}. {dataset.name}</Typography>
      </Box>
      <IconButton onClick={
        (evt: React.MouseEvent<HTMLElement>) => {
          evt.stopPropagation();
          setAnchor(evt.currentTarget);
        }
      }>
        <ChevronRight />
      </IconButton>
      <DatasetPopover dataset={dataset} anchor={anchor} setAnchor={setAnchor} />
    </Stack>
  )
}

const Datasets = ({ datasetsByOrgs }: { datasetsByOrgs: { [source_org: string]: Dataset[]; }}) => (
  <div>
    { 
      Object.entries(datasetsByOrgs).map(([org, datasets]) => (
        <Accordion
          disableGutters
          elevation={0}
          key={org}
          className="!relative"
        >
          <AccordionSummary>
            <Typography className="font-bold">{org}</Typography>
          </AccordionSummary>
          <Divider />
          <AccordionDetails
            className="p-0"
          >
            <List className="m-0 p-0 max-h-[60vh] overflow-y-scroll">
            {
              datasets.map((dataset: Dataset, idx: number) => (
                  <ListItem
                    key={idx}
                    className="p-0"
                  >
                    {/* TODO: consider semantic usage of ListItemX components */}
                    <Stack direction="column" className="w-full">
                      <DatasetItem idx={idx} dataset={dataset} />
                      {idx + 1 < datasets.length && <Divider />}
                    </Stack>
                  </ListItem>
              ))
            }
            </List>
          </AccordionDetails>
          <Divider />
        </Accordion>
      ))
    }
  </div>
);

export default Datasets;
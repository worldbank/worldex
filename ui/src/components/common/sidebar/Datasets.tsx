import ChevronRight from "@mui/icons-material/ChevronRight";
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, IconButton, List, ListItem, Stack, Typography } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedDataset } from "store/selectedSlice";
import { RootState } from "store/store";
import { BoundingBox, Dataset } from "../types";
import classNames from "classnames";
import DatasetPopover from "./DatasetPopover";
import moveViewportToBbox from "utils/moveViewportToBbox";
import ReactMarkdown from 'react-markdown';


const DatasetItem = ({idx, dataset}: {idx: number, dataset: Dataset}) => {
  const [anchor, setAnchor] = useState(null);
  const { selectedDataset } = useSelector((state: RootState) => state.selected);
  const viewState = useSelector((state: RootState) => state.carto.viewState);
  const { location } = useSelector((state: RootState) => state.search);
  const dispatch = useDispatch();
  const toggleVisibility = (datasetId: number, bbox: BoundingBox) => {
    if (anchor) {
      // do not do anything if popover is active
      return;
    }
    if (datasetId === selectedDataset) {
      dispatch(setSelectedDataset(null));
      return;
    }
    // do not zoom/pan to dataset's bbox if a location feature is currently active
    if (!['Polygon', 'MultiPolygon'].includes(location?.geojson.type)) {
      moveViewportToBbox(bbox, viewState, dispatch);
    }
    dispatch(setSelectedDataset(datasetId));
  }

  const descriptionHighlight = dataset?.meta?.highlight?.description

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
        const [minLon, minLat, maxLon, maxLat] = dataset.bbox;
        const bbox = { minLon, minLat, maxLon, maxLat };
        toggleVisibility(dataset.id, bbox);
      }}
    >
      <Stack direction="column">
        <Box className="m-0">
          <article className="prose text-sm">
            <ReactMarkdown>{`${(idx+1).toString()}. ${dataset?.meta?.highlight?.name?.join("...") || dataset.name}`}</ReactMarkdown>
          </article>
          {
            descriptionHighlight
              && (
                <article className="prose text-sm ml-7">
                  <ReactMarkdown>{`${descriptionHighlight?.join("...")}`}</ReactMarkdown>
                </article>
              )
          }

        </Box>
      </Stack>
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

const Datasets = ({ datasets }: { datasets: Dataset[] }) => {
  return (
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
  );
};

// TODO: rm component
const DatasetsByOrgs = ({ datasetsByOrgs, header }: { datasetsByOrgs: { [source_org: string]: Dataset[]; }, header?: string }) => (
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
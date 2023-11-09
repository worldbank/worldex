import ExpandLess from "@mui/icons-material/ExpandLess";
import Info from "@mui/icons-material/Info";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, ButtonGroup, Card, CardContent, Collapse, Divider, IconButton, List, ListItem, Stack, Typography } from "@mui/material";
import classNames from "classnames";
import { UNITS, cellArea, getResolution } from "h3-js";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';
import { RootState } from "store/store";
import groupBy from "utils/groupBy";

const Datasets = ({ datasets }: { datasets: any[] }) => (
  <List className="m-0 py-0 max-h-[100%] overflow-y-auto">
    {
      datasets.map((dataset: any, idx: number) => (
        <div key={dataset.id}>
          <ListItem className="py-2.5">
            <Stack spacing={1}>
              <Typography className="text-sm font-bold">{idx+1}. { dataset.name }</Typography>
              <Typography className="text-xs">{ dataset.description }</Typography>
            </Stack>
          </ListItem>
          {idx + 1 < datasets.length && <Divider />}
        </div>
      ))
    }
  </List>
)

const Selected = () => {
  const { h3Index, datasets } = useSelector((state: RootState) => state.selected);
  const dispatch = useDispatch();

  const organizations = datasets ? [...new Set(datasets.map((d: any) => d.source_org))] : null;
  const datasetsByOrgs = datasets ? groupBy(datasets, "source_org") : null;
  console.log(datasetsByOrgs);

  const handleDeselectClick = () => {
    dispatch(setSelectedH3Index(null));
    dispatch(setDatasets(null));
  }
  
  return h3Index && (
    <div className="h-[100%]">
      <Box className="p-4">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography className="text-lg font-bold">Tile {h3Index}</Typography>
          <Button onClick={handleDeselectClick} size="small" variant="text" className="uppercase">Deselect tile</Button>
        </Stack>
        <Typography className="text-sm">Resolution: {getResolution(h3Index)}</Typography>
        <Typography className="text-sm">Cell area: {cellArea(h3Index, UNITS.km2).toFixed(2)} km<sup className="sups">2</sup></Typography>
        <Typography className="text-sm">Dataset count: {datasets?.length} datasets</Typography>
      </Box>
      <Divider />
      { datasets && (
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
                    datasets.map((dataset, idx: number) => {
                      return (
                        <List className="m-0 py-0 max-h-[100%] overflow-y-auto">
                          <ListItem className="p-0">
                            <Stack className="w-[100%]" spacing={1}>
                              <Stack direction="row" className="p-3 items-center justify-between">
                                <Box className="m-0">
                                  {/* @ts-ignore */}
                                  <Typography className="text-sm font-bold">{idx+1}. { dataset.name }</Typography>
                                  {/* @ts-ignore */}
                                  <Typography className="text-xs">{ dataset.description }</Typography>
                                </Box>
                                {/* <IconButton><Info /></IconButton> */}
                              </Stack>
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
            // datasetsByOrgs.map((org: string) => {
            //   return <Accordion disableGutters elevation={0} key={org} className="!relative">
            //     <AccordionSummary>
            //       <Typography>{org}</Typography>
            //     </AccordionSummary>
            //     <AccordionDetails>
            //       <div key={dataset.id}>
            //         <ListItem className="py-2.5">
            //           <Stack spacing={1}>
            //             <Typography className="text-sm font-bold">{idx+1}. { dataset.name }</Typography>
            //             <Typography className="text-xs italic">{ dataset.source_org }</Typography>
            //             <Typography className="text-xs">{ dataset.description }</Typography>
            //           </Stack>
            //         </ListItem>
            //         {idx + 1 < datasets.length && <Divider />}
            //       </div>
            //     </AccordionDetails>
            //   </Accordion>
            // })
          }
        </div>
      )}
        {/* { datasets && <Datasets datasets={datasets} />} */}
    </div>
    // </Stack>
    //   </CardContent>
    // </Card>
  )
} 

export default Selected;
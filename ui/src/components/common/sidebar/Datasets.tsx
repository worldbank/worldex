import ChevronRight from "@mui/icons-material/ChevronRight";
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, IconButton, Link, List, ListItem, Popover, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { Dataset } from "../types";

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
                  <Link href={file} target="_blank" rel="noopener noreferrer">{file}</Link>
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

export default Datasets;
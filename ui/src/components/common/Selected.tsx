import ExpandMore from "@mui/icons-material/ExpandMore";
import { Box, Card, CardContent, CardHeader, Collapse, Divider, IconButton, List, ListItem, Stack, Typography } from "@mui/material";
import { UNITS, cellArea, getResolution } from "h3-js";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";
import classNames from "classnames";

const Selected = () => {
  const { h3Index, datasets } = useSelector((state: RootState) => state.selected);
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  return h3Index && (
    <Card className="absolute bottom-2.5 right-2.5 w-96">
      <CardContent sx={{ '&:last-child': { pb: 1.5 }}} className="p-0 pt-3">
        <Stack className="px-4" direction="row" alignItems="center" justifyContent="space-between">
          <Typography className="text-lg font-bold">Tile {h3Index}</Typography>
          <IconButton className={classNames({"rotate-180": expanded})} onClick={handleExpandClick}><ExpandMore /></IconButton>
        </Stack>
        <Collapse in={expanded}>
          <Box className="px-4 pb-2">
            <Typography className="text-sm">Resolution: {getResolution(h3Index)}</Typography>
            <Typography className="text-sm">Cell area: {cellArea(h3Index, UNITS.km2).toFixed(2)} km<sup className="sups">2</sup></Typography>
            <Typography className="text-sm">Dataset count: {datasets?.length} datasets</Typography>
          </Box>
          <Divider />
          { datasets && 
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
          }
        </Collapse>
      </CardContent>
    </Card>
      // { { datasets && (
      //   <Box className="overflow-y-scroll">
      //     <DataGrid
      //     rows={datasets}
      //     columns={columns}
      //     initialState={{
      //       pagination: {
      //         paginationModel: {page: 0, pageSize: 10},
      //       },
      //     }}
      //     pageSizeOptions={[10, 20]}
      //     />
      //   </Box>
      //   ) } }
    // </Card>
  )
} 

export default Selected;
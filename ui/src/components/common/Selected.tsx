import { Box, Card, CardContent, CardHeader, Divider, List, ListItem, Stack, Typography } from "@mui/material";
import { UNITS, cellArea, getResolution } from "h3-js";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

const Selected = () => {
  const { h3Index, datasets } = useSelector((state: RootState) => state.selected);
  return h3Index && (
    <Card className="absolute bottom-2.5 right-2.5 w-96">
      <CardHeader title={`Tile ${h3Index}`} className="p-4 pb-2" />
      <CardContent className="p-0">
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
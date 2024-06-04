import { Divider, Typography } from "@mui/material";
import Filters from "components/filters/Filters";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import groupBy from "utils/groupBy";
import { Dataset } from "../types";
import Datasets from "./Datasets";
import Overview from "./Overview";
import Selected from "./Selected";
import { selectAccessibilities, selectSourceOrgFilters } from "store/selectedFiltersSlice";
import { useEffect } from "react";
import { setDatasetCount, setDatasets } from "store/selectedSlice";
import Search from "components/search/Search";
import DeselectDatasetButton from "./DeselectDatasetButton";
import DeselectTileButton from "./DeselectTileButton";
import HidePreviewButton from "./HidePreviewButton";


const Content = () => {
  const { h3Index, datasets: datasets_ }: { h3Index: string, datasets: Dataset[] } = useSelector((state: RootState) => state.selected);
  const { location, filteredDatasets }: { location: any, filteredDatasets: Dataset[] } = useSelector((state: RootState) => state.search);
  // const datasets = h3Index ? datasets_ : filteredDatasets;
  const datasets = datasets_;
  console.log(datasets_);
  const datasetsByOrgs = datasets ? groupBy(datasets, "source_org") : null;
  // const header = h3Index ? 'Tile Datasets' : `${location?.name} Datasets`;
  const header = 'Datasets';

  const { h3Index: selectedH3Index } = useSelector((state: RootState) => state.selected);
  const sourceOrgs = useSelector(selectSourceOrgFilters);
  const accessibilities = useSelector(selectAccessibilities);
  const { filteredDatasets: locationFilteredDatasets }: { filteredDatasets: Dataset[] } = useSelector((state: RootState) => state.search);
  const { datasetCount }: { datasetCount: number } = useSelector((state: RootState) => state.selected);
  const { selectedDataset } = useSelector((state: RootState) => state.selected);
  const { fileUrl: previewFileUrl, isLoadingPreview } = useSelector((state: RootState) => state.preview);

  const isFiltered = (
    locationFilteredDatasets
    || (Array.isArray(sourceOrgs) && sourceOrgs.length > 0)
    || (Array.isArray(accessibilities) && accessibilities.length > 0)
  )
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedH3Index) {
      fetch(`${import.meta.env.VITE_API_URL}/dataset_metadata/${selectedH3Index}`, {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_org: sourceOrgs,
          accessibility: accessibilities,
        }),
      })
      .then((resp: Response) => resp.json())
      .then((results) => {
        dispatch(setDatasets(results));
      });
    }
  }, [selectedH3Index, sourceOrgs, accessibilities]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/dataset_count/`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_org: sourceOrgs,
        accessibility: accessibilities,
      })
    })
    .then(resp => resp.json())
    .then((data) => {
      dispatch(setDatasetCount(data["dataset_count"]))
    });
  }, [sourceOrgs, accessibilities]);

  console.log(datasetsByOrgs);
  return (
    <div className="h-full">
      <Search className="p-3" />
      {/* <Divider /> */}
      {/* { h3Index ? <Selected /> : <Overview /> } */}
      <Divider />
      <Filters className="p-4 pb-6" />
      <Divider />
      <div className="px-4 py-3.5">
        <Typography className="text-md font-bold">
          <span>
            Total datasets indexed
            { isFiltered && ' (filtered)' }:{' '}
          </span>
          {/* <span className="text-lg">{locationFilteredDatasets ? locationFilteredDatasets.length : datasetCount}</span> */}
          <span className="text-lg">{ datasets ? datasets.length : datasetCount}</span>
        </Typography>
        {
          (selectedDataset || selectedH3Index || (previewFileUrl && !isLoadingPreview)) ? (
            <div className="flex justify-start mt-3.5">
              { selectedDataset && <DeselectDatasetButton className="p-0 leading-4 first:text-left" /> }
              { selectedH3Index && <DeselectTileButton className="p-0 leading-4 first:text-left last:text-right" /> }
              { (previewFileUrl && !isLoadingPreview) && <HidePreviewButton className="p-0 leading-4 first:text-left last:text-right" /> }
            </div>
          ) : null
        }
      </div>
      <Divider />
      { datasets && <Datasets datasets={datasets} /> }
    </div>
  );
};

export default Content;
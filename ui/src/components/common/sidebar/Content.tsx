import { Divider, Typography } from "@mui/material";
import Filters from "components/filters/Filters";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import { Dataset } from "../types";
import Datasets from "./Datasets";
import { selectAccessibilities, selectSourceOrgFilters, setH3IndexedDatasets } from "store/selectedFiltersSlice";
import { useEffect } from "react";
import { selectDatasetIds, setDatasetCount, setDatasets } from "store/selectedSlice";
import Search from "components/search/Search";
import DeselectDatasetButton from "./DeselectDatasetButton";
import DeselectTileButton from "./DeselectTileButton";
import HidePreviewButton from "./HidePreviewButton";


const Content = () => {
  const { selectedDataset, h3Index, datasets: datasets_ }: { selectedDataset: Dataset, h3Index: string, datasets: Dataset[] } = useSelector((state: RootState) => state.selected);
  const { location }: { location: any } = useSelector((state: RootState) => state.search);
  const { h3IndexedDatasets } : { h3IndexedDatasets: Dataset[] } = useSelector((state: RootState) => state.selectedFilters);
  const datasetIds = useSelector(selectDatasetIds);

  let datasets = h3Index ? h3IndexedDatasets : datasets_;
  if ((!Array.isArray(datasets) || datasets.length === 0) && selectedDataset) {
    datasets = [selectedDataset];
  }

  const { h3Index: selectedH3Index } = useSelector((state: RootState) => state.selected);
  const sourceOrgs = useSelector(selectSourceOrgFilters);
  const accessibilities = useSelector(selectAccessibilities);
  const { datasetCount }: { datasetCount: number } = useSelector((state: RootState) => state.selected);
  const { fileUrl: previewFileUrl, isLoadingPreview } = useSelector((state: RootState) => state.preview);

  const isFiltered = (
    (Array.isArray(datasetIds) && datasetIds.length > 0)
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
          dataset_ids: datasetIds,
        }),
      })
      .then((resp: Response) => resp.json())
      .then((results) => {
        dispatch(setH3IndexedDatasets(results));
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

  return (
    <div className="h-full">
      <Search className="p-3" />
      <Divider />
      <Filters className="p-4 pb-6" />
      <Divider />
      <div className="px-4 py-3.5">
        <Typography className="text-md font-bold">
          <span>
            { selectedH3Index ? `Tile ${selectedH3Index} datasets` : `Total datasets`}
            { isFiltered ? ' (filtered)' : ''}
            {": "}
            { datasets.length || datasetCount }
          </span>
        </Typography>
        {
          location?.display_name && (<span className="text-xs italic">{location.display_name}</span>)
        }
        {
          (selectedDataset || selectedH3Index || (previewFileUrl && !isLoadingPreview)) ? (
            <div className="flex justify-start mt-1">
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
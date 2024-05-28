import { Divider } from "@mui/material";
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
import { setDatasets } from "store/selectedSlice";


const Content = () => {
  const { h3Index, datasets: datasets_ }: { h3Index: string, datasets: Dataset[] } = useSelector((state: RootState) => state.selected);
  const { location, filteredDatasets }: { location: any, filteredDatasets: Dataset[] } = useSelector((state: RootState) => state.location);
  const datasets = h3Index ? datasets_ : filteredDatasets;
  const datasetsByOrgs = datasets ? groupBy(datasets, "source_org") : null;
  const header = h3Index ? 'Tile Datasets' : `${location?.name} Datasets`;

  const { h3Index: selectedH3Index } = useSelector((state: RootState) => state.selected);
  const sourceOrgs = useSelector(selectSourceOrgFilters);
  const accessibilities = useSelector(selectAccessibilities);
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

  return (
    <div className="h-full">
      { h3Index ? <Selected /> : <Overview /> }
      <Divider />
      <Filters className="p-4 pb-6" />
      <Divider />
      { datasetsByOrgs && <Datasets header={header} datasetsByOrgs={datasetsByOrgs} /> }
    </div>
  );
};

export default Content;
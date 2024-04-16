import { Divider } from "@mui/material";
import Filters from "components/filters/Filters";
import { useSelector } from "react-redux";
import { RootState } from "store/store";
import groupBy from "utils/groupBy";
import { Dataset } from "../types";
import Datasets from "./Datasets";
import Overview from "./Overview";
import Selected from "./Selected";


const Content = () => {
  const { h3Index, datasets: datasets_ }: { h3Index: string, datasets: Dataset[] } = useSelector((state: RootState) => state.selected);
  const { location, filteredDatasets }: { location: any, filteredDatasets: Dataset[] } = useSelector((state: RootState) => state.location);
  const datasets = h3Index ? datasets_ : filteredDatasets;
  const datasetsByOrgs = datasets ? groupBy(datasets, "source_org") : null;
  const header = h3Index ? 'Tile Datasets' : `${location?.name} Datasets`;
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
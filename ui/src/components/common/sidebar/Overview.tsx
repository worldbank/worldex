import { Typography } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDatasetCount } from "store/selectedSlice";
import { RootState } from "store/store";
import DeselectDatasetButton from "./DeselectDatasetButton";
import HidePreviewButton from "./HidePreviewButton";

const Overview = () => {
  const { datasetCount }: { datasetCount: number } = useSelector((state: RootState) => state.selected);
  const dispatch = useDispatch();
  const { zoom } = useSelector((state: RootState) => state.carto.viewState);
  const { h3Resolution, zIndex } = useSelector((state: RootState) => state.app);
  const { selectedDataset } = useSelector((state: RootState) => state.selected);
  const { fileUrl: previewFileUrl, isLoadingPreview } = useSelector((state: RootState) => state.preview);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/dataset_count/`, {
      method: 'post',
    })
    .then(resp => resp.json())
    .then((data) => {
      dispatch(setDatasetCount(data["dataset_count"]))
    });
  }, []);

  return (
    <div className="p-4">
      <Typography className="text-md font-bold">
        <span>Total datasets indexed: </span>
        <span className="text-lg">{datasetCount}</span>
      </Typography>
      <Typography className="text-sm">
        Zoom level: {zoom.toFixed(2)}
      </Typography>
      <Typography className="text-sm">
        Tile z-index: {zIndex}
      </Typography>
      <Typography className="text-sm">
        H3 resolution: {h3Resolution}
      </Typography>
      { selectedDataset && <DeselectDatasetButton /> }
      { (previewFileUrl && !isLoadingPreview) && <HidePreviewButton /> }
    </div>
  );
};

export default Overview;
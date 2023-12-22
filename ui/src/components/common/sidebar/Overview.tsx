import { Divider, Typography } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDatasetCount } from "store/selectedSlice";
import { RootState } from "store/store";

const Overview = () => {
  const { datasetCount }: { datasetCount: number } = useSelector((state: RootState) => state.selected);
  const dispatch = useDispatch();
  const h3Resolution = useSelector((state: RootState) => state.app.h3Resolution);
  
  useEffect(() => {
    fetch(`/api/dataset_count/`, {
      method: 'post',
    })
    .then(resp => resp.json())
    .then((data) => {
      dispatch(setDatasetCount(data["dataset_count"]))
    });
  }, []);
  
  return (
    <>
      <div className="p-4">
        <Typography className="text-md font-bold">
          <span>Total datasets indexed: </span>
          <span className="text-lg">{datasetCount}</span>
        </Typography>
        <Typography className="text-sm">
          Current H3 resolution: {h3Resolution}
        </Typography>
      </div>
      <Divider />
    </>
  );
};

export default Overview;
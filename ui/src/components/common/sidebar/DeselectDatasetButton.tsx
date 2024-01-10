import { Button } from "@mui/material";
import { useDispatch } from "react-redux"
import { setSelectedDataset } from "store/selectedSlice";

const DeselectDatasetButton = () => {
  const dispatch = useDispatch();
  return (
    <Button 
      size="small"
      variant="text"
      className="uppercase mt-1 p-0 hover:bg-transparent"
      onClick={() => {
        dispatch(setSelectedDataset(null));
      }}
    >
      Deselect dataset
    </Button>
  )
}

export default DeselectDatasetButton;

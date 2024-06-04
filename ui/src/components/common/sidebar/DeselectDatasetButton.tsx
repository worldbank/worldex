import { Button } from "@mui/material";
import { useDispatch } from "react-redux"
import { setSelectedDataset } from "store/selectedSlice";

const DeselectDatasetButton = ({ className }: { className?: string }) => {
  const dispatch = useDispatch();
  return (
    <Button
      size="small"
      variant="text"
      className={`uppercase hover:bg-transparent ${className}`}
      onClick={() => {
        dispatch(setSelectedDataset(null));
      }}
    >
      Deselect dataset
    </Button>
  )
}

export default DeselectDatasetButton;

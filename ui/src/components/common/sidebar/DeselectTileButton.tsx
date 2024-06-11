import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { setH3IndexedDatasets } from "store/selectedFiltersSlice";
import { setH3Index as setSelectedH3Index } from 'store/selectedSlice';

const DeselectTileButton = ({ className }: { className?: string }) => {
  const dispatch = useDispatch();
  return (
    <Button
      size="small"
      variant="text"
      className={`uppercase hover:bg-transparent ${className}`}
      onClick={() => {
        dispatch(setSelectedH3Index(null));
        dispatch(setH3IndexedDatasets([]));
      }}
    >
      Deselect tile
    </Button>
  )
}

export default DeselectTileButton;

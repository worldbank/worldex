import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { setDatasets, setH3Index as setSelectedH3Index } from 'store/selectedSlice';

const DeselectTileButton = ({ className }: { className?: string }) => {
  const dispatch = useDispatch();
  return (
    <Button
      size="small"
      variant="text"
      className={`uppercase hover:bg-transparent ${className}`}
      onClick={() => {
        dispatch(setSelectedH3Index(null));
        dispatch(setDatasets(null));
      }}
    >
      Deselect tile
    </Button>
  )
}

export default DeselectTileButton;
import { Button } from "@mui/material";
import { useDispatch } from "react-redux"
import { setFileUrl } from "store/previewSlice";

const HidePreviewButton = () => {
  const dispatch = useDispatch();
  return (
    <Button
      size="small"
      variant="text"
      className="uppercase mt-1 p-0 hover:bg-transparent"
      onClick={() => {
        dispatch(setFileUrl(null));
      }}
    >
      Hide file preview
    </Button>
  )
}

export default HidePreviewButton;

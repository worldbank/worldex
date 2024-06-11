import { Button } from "@mui/material";
import { useDispatch } from "react-redux"
import { setFileUrl } from "store/previewSlice";

const HidePreviewButton = ({ className }: { className?: string }) => {
  const dispatch = useDispatch();
  return (
    <Button
      size="small"
      variant="text"
      className={`uppercase hover:bg-transparent ${className}`}
      onClick={() => {
        dispatch(setFileUrl(null));
      }}
    >
      Hide file preview
    </Button>
  )
}

export default HidePreviewButton;

import { IconButton, Link, Popover, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { format } from "date-fns";
import { Dataset } from "../types";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDispatch, useSelector } from "react-redux";
import { setPreviewedFileUrl } from "store/selectedSlice";
import { RootState } from "store/store";


const isPreviewable = (file: string) => file.endsWith('.zip');

const FilesTable = ({files}: {files: string[]}) => {
  const { previewedFileUrl } = useSelector((state: RootState) => state.selected);
  console.log(previewedFileUrl);
  const dispatch = useDispatch();
  return <>
    <Typography className="text-sm">
      <strong>Files:</strong>
    </Typography>
    <TableContainer className="max-w-100 overflow-x-scroll">
      <Table size="small" aria-label="files table">
        <TableBody>
          {files.map((file: string, idx: number) => (
            <TableRow key={idx}>
              <TableCell className="pl-0 pr-1">
                  {
                    isPreviewable(file)
                      ? (
                        <IconButton 
                          color={ previewedFileUrl === file ? "primary" : "default" }
                          onClick={() => dispatch(setPreviewedFileUrl(file)) }>
                          <VisibilityIcon />
                        </IconButton>
                      ) : (
                        <IconButton disabled>
                          <VisibilityOffIcon />
                        </IconButton>
                      )
                  }
              </TableCell>
              <TableCell className="pl-0 whitespace-nowrap">
                <Link href={file} target="_blank">{file}</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </>
};
  
const DatasetPopover = ({ dataset, anchor, setAnchor }: { dataset: Dataset, anchor: any, setAnchor: any }) => {
  const open = Boolean(anchor);
  const dateFormat = "yyyy MMM d";
  return (
    <Popover
      className="p-2 max-h-[80vh]"
      open={open}
      anchorEl={anchor}
      onClose={() => { setAnchor(null) }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      >
      <div className="p-4 max-w-lg">
        {
          dataset.description.split("\n").map((desc: string, idx: number) => (
            <Typography key={idx} className="mb-1.5 text-sm">{desc}</Typography>
          ))
        }
        <div className="py-2">
          {
            (dataset.date_start && dataset.date_end) && (
              <Typography className="text-sm">
                <strong>Date:</strong>
                {` ${format(dataset.date_start, dateFormat)} - ${format(dataset.date_end, dateFormat)}`}
              </Typography>
            )
          }
          <Typography className="text-sm">
            <strong>Accessibility:</strong>{" "}
            <span className="capitalize">{dataset.accessibility}</span>
          </Typography>
          <Typography className="text-sm">
            <strong>Source:</strong>{" "}<Link href={dataset.url} target="_blank" rel="noopener noreferrer">{dataset.url}</Link>
          </Typography>
        </div>
        { dataset.files && <FilesTable files={dataset.files} />}
      </div>
    </Popover>
  )
}

export default DatasetPopover;
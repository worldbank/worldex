import { CircularProgress, IconButton, Link, Popover, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { format } from "date-fns";
import { Dataset } from "../types";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import { setFileUrl } from "store/previewSlice";
import ReactMarkdown from 'react-markdown';

// TODO: separate into a util file
const isPreviewable = (file: string) => [
  '.zip',
  '.geojson',
  '.tif',
  '.tiff',
  '.geotif',
  '.geotiff',
].some((ext) => file.endsWith(ext));

const PreviewButton = ({ file }: { file: string }) => {
  const { isLoadingPreview, fileUrl } = useSelector((state: RootState) => state.preview);
  const dispatch = useDispatch();
  return (
    isPreviewable(file) && (
      isLoadingPreview && (file === fileUrl)
        ? <CircularProgress className="m-1 mb-0" size="1em" />
        : <IconButton
          size='small'
          disabled={isLoadingPreview}
          color={ fileUrl === file ? "primary" : "default" }
          onClick={() => dispatch(setFileUrl(file === fileUrl ? null : file)) }>
            <VisibilityIcon />
           </IconButton>
    )
  );
}

const FilesTable = ({files}: {files: string[]}) => <>
  <Typography className="text-sm">
    <strong>Files:</strong>
  </Typography>
  <TableContainer className="max-w-100 overflow-x-scroll">
    <Table size="small" aria-label="files table">
      <TableBody>
        {files.map((file: string, idx: number) => (
          <TableRow key={idx}>
            <TableCell className="pl-0 pr-1">
              <PreviewButton file={file} />
            </TableCell>
            <TableCell className="pl-0 whitespace-nowrap">
              <Link href={file} target="_blank">{file}</Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</>;

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
            <strong>Source Organization:</strong>{" "}
            <span>{dataset.source_org}</span>
          </Typography>
          <Typography className="text-sm">
            <strong>Accessibility:</strong>{" "}
            <span className="capitalize">{dataset.accessibility || "-"}</span>
          </Typography>
          <Typography className="text-sm">
            <strong>URL:</strong>{" "}<Link href={dataset.url} target="_blank" rel="noopener noreferrer">{dataset.url}</Link>
          </Typography>
        </div>
        { dataset.files && <FilesTable files={dataset.files} />}
      </div>
    </Popover>
  )
}

export default DatasetPopover;
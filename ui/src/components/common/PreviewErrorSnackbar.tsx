import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert, SnackbarCloseReason } from '@mui/material';
import { RootState } from 'store/store';
import { setErrorMessage } from 'store/previewSlice';

const PreviewErrorSnackbar = () => {
  const { errorMessage } = useSelector((state: RootState) => state.preview);
  const dispatch = useDispatch();
  const handleClose = (event: Event | React.SyntheticEvent<any, Event>, reason: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(setErrorMessage(null));
  };
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={!!errorMessage}
      onClose={handleClose}
      autoHideDuration={4000}
    >
      <Alert severity="error">
        {errorMessage}
      </Alert>
    </Snackbar>
  )
}

export default PreviewErrorSnackbar;

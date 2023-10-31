import { Box, IconButton, Modal, Typography } from "@mui/material";
import { useState } from "react";
import CloseIcon from '@mui/icons-material/Close'

const WelcomeModal = () => {
  const [open, setOpen] = useState(true);
  const handleClose = () => setOpen(false);

  return (
    <Modal disableAutoFocus open={open} onClose={handleClose}>
      <Box className="absolute inset-x-1/2 inset-y-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-64 bg-neutral-50 p-4 rounded-md shadow-md">
        <IconButton onClick={handleClose} className="absolute top-1 right-1">
          <CloseIcon />
        </IconButton>
        <Typography className="text-lg font-bold pb-2">Welcome to WorldEx!</Typography>
        <p className="pb-2">
          A global catalog of n socioeconomic geospatial data that leverages H3 indexing to improve subnational data discoverability.
        </p>
        <p className="pb-2">
          We are constantly indexing new datasets and partnering with various organizations to broaden the diversity of the datasets indexed in Worldex. Here are the latest updates.
        </p>
      </Box>
    </Modal>
  )
}

export default WelcomeModal;

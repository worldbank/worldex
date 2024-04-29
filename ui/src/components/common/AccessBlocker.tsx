import { Box, Divider, Paper, Typography, styled, useTheme } from '@mui/material';
import Modal from '@mui/material/Modal';

const BlurredModal = styled(Modal)`
  && {
    .MuiBackdrop-root {
      backdrop-filter: blur(4px);
    }
  }
`;

const AccessBlocker = () => (
  <BlurredModal disableAutoFocus={true} open={true}>
    <div className="
      absolute
      width-[400px]
      height-[100px]
      top-1/2
      left-1/2
      transform
      -translate-x-1/2
      -translate-y-1/2
      rounded-md
    ">
      <Typography className="
        py-4
        pb-3
        text-center
        text-3xl
        text-white
        font-bold
      ">
        WorldEx
      </Typography>
      <Divider className="border-1 border-slate-300" />
      <div className="px-6 pb-5 pt-3 text-center">
        <Typography className="text-2xl text-white font-medium">Find subnational data smarter.</Typography>
        <Typography className="text-white">Launching in June 2024</Typography>
      </div>
    </div>
  </BlurredModal>
);

export default AccessBlocker;

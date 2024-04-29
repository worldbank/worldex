import { Box, Divider, Paper, Typography, styled, useTheme } from '@mui/material';
import Modal from '@mui/material/Modal';

const BlurredModal = styled(Modal)`
  && {
    .MuiBackdrop-root {
      backdrop-filter: blur(4px);
    }
  }
`;

export default function AccessBlocker() {
  const theme = useTheme();
  return <BlurredModal disableAutoFocus={true} open={true}>
    <div className={`
      absolute
      bg-[${theme.palette.brand.navyBlue.toLowerCase()}]
      width-[400px]
      height-[100px]
      top-1/2
      left-1/2
      transform
      -translate-x-1/2
      -translate-y-1/2
      rounded-md
    `}>
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
      <Divider className="border-slate-500 border-1" />
      <div className="px-6 pb-5 pt-3 text-center">
        <Typography className="text-2xl text-white font-medium">Find subnational data smarter.</Typography>
        <Typography className="text-white">Launching in June 2024</Typography>
      </div>
    </div>
  </BlurredModal>
};
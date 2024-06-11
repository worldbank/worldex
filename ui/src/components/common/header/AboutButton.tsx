import { IconButton, useMediaQuery } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export default function AboutButton({ className, onClick }: { className?: string, onClick: any }) {
  return (
    <IconButton onClick={onClick} className={`sm:w-20 text-white ${className}`} arial-label="about">
      <InfoIcon className='mr-1' />
      <span className="text-xs font-bold sm:inline hidden">About</span>
    </IconButton>
  )
}
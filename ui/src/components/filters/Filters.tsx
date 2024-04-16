import { Typography } from '@mui/material';
import Accessibility from './Accessibility';
import SourceOrganization from './SourceOrganization';

function Filters({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Typography className="mb-2 font-bold">Search Filters</Typography>
      <div>
        <SourceOrganization />
        <Accessibility />
      </div>
    </div>
  );
}

export default Filters;

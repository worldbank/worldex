import { Typography } from '@mui/material';
import Accessibility from './Accessibility';
import SourceOrganization from './SourceOrganization';

function Filters({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Typography variant="h3" className="text-sm mb-2">Search Filters</Typography>
      <div>
        <SourceOrganization />
        <Accessibility />
      </div>
    </div>
  );
}

export default Filters;

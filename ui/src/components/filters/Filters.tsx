import { Typography } from '@mui/material';
import Accessibility from './Accessibility';
import SourceOrganization from './SourceOrganization';
import ClearFiltersButton from './ClearFiltersButton';

function Filters({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <Typography className="font-bold">Filters</Typography>
        <ClearFiltersButton className="mr-2" />
      </div>
      <div>
        <SourceOrganization />
        <Accessibility />
      </div>
    </div>
  );
}

export default Filters;

import { Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setSourceOrgs, setAccessibilities } from 'store/selectedFiltersSlice';

function ClearFiltersButton({ className }: { className?: string }) {
  const dispatch = useDispatch();
  return (
    <Button
      size="small"
      variant="text"
      className={`${className} uppercase p-0 hover:bg-transparent`}
      onClick={() => {
        dispatch(setSourceOrgs({}));
        dispatch(setAccessibilities({}));
      }}
    >
      Clear filters
    </Button>
  );
}

export default ClearFiltersButton;

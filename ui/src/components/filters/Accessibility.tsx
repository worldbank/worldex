import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary, Checkbox, FormControlLabel, FormGroup,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setAccessibilities as setSelectedAccessibilities,
  updateAcccessibilities as updateSelectedAccessibilities,
} from 'store/selectedFiltersSlice';
import { RootState } from 'store/store';

function Accessibility({ className }: { className?: string }) {
  const dispatch = useDispatch();
  const { accessibilities: selectedAccessibilities } = useSelector((state: RootState) => state.selectedFilters);
  const [accessibilities, setAccessibilities] = useState([]);

  const handleChange = (event: any) => {
    const { name, checked } = event.target;
    // @ts-ignore
    dispatch(updateSelectedAccessibilities({ [name]: checked }));
  };

  useEffect(() => {
    const fetchAccessibilities = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/filters/accessibility`);
        const data = await response.json();
        setAccessibilities(data);

        // Initialize selection state
        const initialAccessibilitiesState = data.reduce((acc: any, d: string) => {
          acc[d] = false;
          return acc;
        }, {});

        dispatch(setSelectedAccessibilities(initialAccessibilitiesState));
      } catch (error) {
        console.error('Failed to fetch accessibilities:', error);
      }
    };
    fetchAccessibilities();
  }, []);

  return (
    <Accordion
      className="
      !relative
      !w-full
      border
      !border-t-0
      border-gray-200
      !rounded-t-none"
    >
      <AccordionSummary
        className="bg-gray-100"
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography className="uppercase text-sm font-bold">Accessibility</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormGroup>
          {
            Array.isArray(accessibilities) && accessibilities.length > 0 && (
              accessibilities.map((a11y: string) => (
                <FormControlLabel
                  key={a11y}
                  control={(
                    <Checkbox
                      checked={selectedAccessibilities[a11y] ?? false}
                      onChange={handleChange}
                      name={a11y}
                    />
              )}
                  label={a11y}
                />
              ))
            )
        }
        </FormGroup>
      </AccordionDetails>
    </Accordion>
  );
}

export default Accessibility;

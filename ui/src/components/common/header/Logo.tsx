import { Link } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { ROUTE_PATHS } from 'routes';

export default function Logo() {
  return (
    <Link component={NavLink} to={ROUTE_PATHS.DEFAULT}>
      {/* <LogoXS /> */}
    </Link>
  );
}

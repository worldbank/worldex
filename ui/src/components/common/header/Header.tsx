import { useCallback, useEffect, useState } from 'react';
import { Divider, Grid, IconButton, useMediaQuery } from '@mui/material';
import { AppBar } from '@carto/react-ui';
import DrawerMenu from './DrawerMenu';
import NavigationMenu from './NavigationMenu';
import InfoIcon from '@mui/icons-material/Info';
import UserMenu from './UserMenu';
import { styled, Theme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import AboutModal from 'components/common/AboutModal';
import AboutButton from './AboutButton';

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 1,
}));

export const StyledDivider = styled(Divider)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

export default function Header() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const smDownHidden = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md'),
  );

  const handleAboutOpen = () => setAboutOpen(true);
  const handleAboutClose = () => setAboutOpen(false);

  return (
    <StyledAppBar
      position='relative'
      showBurgerMenu
      onClickMenu={handleDrawerToggle}
      // brandLogo={<Logo />}
      brandText='WorldEx'
    >
      {smDownHidden ? (
        <>
          <DrawerMenu
            drawerOpen={drawerOpen}
            handleDrawerToggle={handleDrawerToggle}
          />
          <AboutButton onClick={handleAboutOpen} className='justify-items-end' />
        </>
      ) : (
        <>
          <StyledDivider orientation='vertical' flexItem light></StyledDivider>
          <AboutModal open={aboutOpen} onClose={handleAboutClose} />
          <NavigationMenu />
          <Grid container item xs justifyContent='flex-end'>
            <UserMenu />
            <AboutButton onClick={handleAboutOpen} />
          </Grid>
        </>
      )}
    </StyledAppBar>
  );
}

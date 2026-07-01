import styled from '@emotion/styled';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { LogoOpenClimbing } from '../../assets/LogoOpenClimbing';
import { t } from '../../services/intl';
import { profilePathForOsmDisplayName } from '../../services/my-ticks/profilePaths';
import { isDesktop, useMobileMode } from '../helpers';
import { useAddNewCragContext } from '../Map/HamburgerMenu/AddNewCrag/AddNewCragContext';
import { HamburgerMenu } from '../Map/HamburgerMenu/HamburgerMenu';
import { LoginIconButton } from '../Map/HamburgerMenu/LoginIconButton';
import { SEARCH_BOX_HEIGHT } from '../SearchBox/consts';
import { SearchField } from '../SearchBox/SearchBox';
import { useFeatureContext } from '../utils/FeatureContext';
import { useOsmAuthContext } from '../utils/OsmAuthContext';

const COMMUNITY_URL = 'https://community.openclimbing.org';

const Bar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${SEARCH_BOX_HEIGHT}px;
  z-index: 1200; // 1100 is PanelWrapper

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  box-sizing: border-box;

  background-color: ${({ theme }) => theme.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  -webkit-backdrop-filter: blur(35px);
  backdrop-filter: blur(35px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
`;

const BrandLink = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.palette.text.primary};
  text-decoration: none;
  flex-shrink: 0;

  &:hover {
    text-decoration: none;
    opacity: 0.85;
  }
`;

const BrandName = styled.span`
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;

  @media ${isDesktop} {
    display: inline;
  }
`;

const navButtonSx = {
  whiteSpace: 'nowrap',
  textTransform: 'none',
  fontSize: 15,
  color: 'text.primary',
} as const;

const SearchSlot = styled.div`
  flex: 1 1 auto;
  min-width: 0;

  @media ${isDesktop} {
    flex: 0 1 360px;
    margin-left: auto;
  }

  .MuiAutocomplete-root {
    flex: 1;
  }
`;

const Brand = () => {
  const isMobileMode = useMobileMode();
  const { persistShowHomepage } = useFeatureContext();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    persistShowHomepage();
  };

  return (
    <BrandLink href="/" onClick={handleClick} aria-label="OpenClimbing">
      <LogoOpenClimbing width={36} style={{ minWidth: 36 }} />
      {!isMobileMode && <Typography variant="h4">OpenClimbing</Typography>}
    </BrandLink>
  );
};

const NavLinks = () => (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <Button component={Link} href="/climbing-areas" sx={navButtonSx}>
      {t('topbar.climbing_areas')}
    </Button>
    <Button
      component={Link}
      href={COMMUNITY_URL}
      target="_blank"
      sx={navButtonSx}
    >
      {t('topbar.community')}
    </Button>
    <Button component={Link} href="/about" sx={navButtonSx}>
      {t('topbar.about')}
    </Button>
  </Stack>
);

const AddClimbingCta = () => {
  const { start } = useAddNewCragContext();

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddLocationAltIcon />}
      onClick={() => start()}
      sx={{ textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
    >
      {t('topbar.add_climbing')}
    </Button>
  );
};

const ProfileButton = () => {
  const { loggedIn, osmUser, handleLogin } = useOsmAuthContext();

  if (loggedIn && osmUser) {
    return (
      <Tooltip title={t('topbar.my_profile')}>
        <IconButton
          component={Link}
          href={profilePathForOsmDisplayName(osmUser)}
          aria-label={t('topbar.my_profile')}
        >
          <LoginIconButton size={30} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={t('user.login_register')}>
      <IconButton onClick={handleLogin} aria-label={t('user.login_register')}>
        <AccountCircleIcon />
      </IconButton>
    </Tooltip>
  );
};

export const TopBar = () => {
  const isMobileMode = useMobileMode();
  const router = useRouter();

  // The directions page brings its own top-left search UI.
  const isDirections = router.asPath.startsWith('/directions');

  if (isMobileMode) {
    return (
      <Bar>
        <Brand />
        <SearchSlot>{!isDirections && <SearchField />}</SearchSlot>
        <HamburgerMenu />
      </Bar>
    );
  }

  return (
    <Bar>
      <Brand />
      <NavLinks />
      <Box sx={{ flexGrow: 1 }} />
      <SearchSlot>{!isDirections && <SearchField />}</SearchSlot>
      <AddClimbingCta />
      <ProfileButton />
      <HamburgerMenu forceMenuIcon />
    </Bar>
  );
};

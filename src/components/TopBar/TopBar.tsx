import styled from '@emotion/styled';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, IconButton, Stack } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { LogoOpenClimbing } from '../../assets/LogoOpenClimbing';
import { t } from '../../services/intl';
import { isDesktop, isMobileMode } from '../helpers';
import { useAddNewCragContext } from '../Map/HamburgerMenu/AddNewCrag/AddNewCragContext';
import { HamburgerMenu } from '../Map/HamburgerMenu/HamburgerMenu';
import { SEARCH_BOX_HEIGHT } from '../SearchBox/consts';
import { SearchField } from '../SearchBox/SearchBox';
import { convertHexToRgba } from '../utils/colorUtils';
import { useFeatureContext } from '../utils/FeatureContext';

const COMMUNITY_URL = 'https://community.openclimbing.org';

const Bar = styled.div<{ $transparent?: boolean }>`
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

  ${({ $transparent, theme }) =>
    $transparent
      ? `
    background-color: transparent;
  `
      : `
    background-color: ${theme.palette.background.paper};
    border-bottom: 1px solid ${theme.palette.divider};
    -webkit-backdrop-filter: blur(35px);
    backdrop-filter: blur(35px);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  `}
`;

// Both bars stay in the SSR HTML; CSS picks the visible one – no useMediaQuery flash.
const DesktopBar = styled(Bar)`
  @media ${isMobileMode} {
    display: none;
  }
`;

const MobileBar = styled(Bar)`
  display: none;
  @media ${isMobileMode} {
    display: flex;
    align-items: center;
    padding: 6px;
    height: auto;
    min-height: 0;
  }
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

// the weight stays the same in both states, otherwise the items would resize
const navButtonSx = (active: boolean) =>
  ({
    whiteSpace: 'nowrap',
    textTransform: 'none',
    textDecoration: 'none',
    fontSize: 15,
    minWidth: 'auto',
    color: active ? 'primary.main' : 'text.primary',
    '&:hover, &:focus': { textDecoration: 'none' },
  }) as const;

// the caret sits on the bottom edge of the bar and points at the open panel
const NavItem = styled.div<{ $active?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  align-self: stretch;

  ${({ $active, theme }) =>
    $active &&
    `&::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 7px solid ${theme.palette.primary.main};
    }`}
`;

type NavButtonProps = {
  label: string;
  href: string;
  active?: boolean;
  target?: string;
  onClick?: (e: React.MouseEvent) => void;
};

const NavButton = ({
  label,
  href,
  active = false,
  target,
  onClick,
}: NavButtonProps) => (
  <NavItem $active={active}>
    <Button
      component={Link}
      href={href}
      target={target}
      onClick={onClick}
      sx={navButtonSx(active)}
    >
      {label}
    </Button>
  </NavItem>
);

// frosted circles matching maplibre geolocate / compass controls
const MapControlIconButton = styled(IconButton)`
  width: 44px;
  height: 44px;
  padding: 0;
  background: ${({ theme }) =>
    convertHexToRgba(theme.palette.background.paper, 0.8)};
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);

  &:hover {
    background: ${({ theme }) => theme.palette.background.paper};
  }
`;

const MobileActions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
`;

const SearchSlot = styled.div`
  flex: 1 1 auto;
  min-width: 0;

  @media ${isDesktop} {
    flex: 0 1 280px;
    margin-left: auto;
  }

  .MuiAutocomplete-root {
    flex: 1;
  }
`;

const Brand = () => {
  const { persistShowHomepage } = useFeatureContext();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    persistShowHomepage();
  };

  return (
    <BrandLink
      href="/"
      onClick={handleClick}
      aria-label={t('topbar.climbing_areas')}
    >
      <LogoOpenClimbing width={36} style={{ minWidth: 36 }} />
    </BrandLink>
  );
};

// desktop only – on mobile the logo opens climbing areas / homepage
const NavLinks = () => {
  const router = useRouter();
  const { homepageShown, persistShowHomepage } = useFeatureContext();

  const openHomepage = (e: React.MouseEvent) => {
    e.preventDefault();
    persistShowHomepage();
  };

  const areasActive = homepageShown || router.pathname === '/climbing-areas';
  const aboutActive = router.pathname === '/about';

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: 'center',
        alignSelf: 'stretch',
        minWidth: 0,
      }}
    >
      <NavButton
        label={t('topbar.climbing_areas')}
        href="/"
        onClick={openHomepage}
        active={areasActive}
      />
      <NavButton label={t('topbar.about')} href="/about" active={aboutActive} />
      <NavButton label={t('topbar.community')} href={COMMUNITY_URL} />
    </Stack>
  );
};

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
      {t('add_new_crag.menu_link')}
    </Button>
  );
};

export const TopBar = () => {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  // The directions page brings its own top-left search UI.
  const isDirections = router.asPath.startsWith('/directions');

  return (
    <>
      <DesktopBar>
        <Brand />
        <NavLinks />
        <Box sx={{ flexGrow: 1 }} />
        <SearchSlot>{!isDirections && <SearchField />}</SearchSlot>
        <AddClimbingCta />
        <HamburgerMenu />
      </DesktopBar>

      {searchOpen && !isDirections ? (
        <MobileBar $transparent>
          <SearchSlot>
            <SearchField autoFocus />
          </SearchSlot>
          <MapControlIconButton
            onClick={() => setSearchOpen(false)}
            aria-label={t('close_panel')}
          >
            <CloseIcon />
          </MapControlIconButton>
        </MobileBar>
      ) : (
        <MobileBar $transparent>
          <Brand />
          <Box sx={{ flexGrow: 1 }} />
          <MobileActions>
            {!isDirections && (
              <MapControlIconButton
                onClick={() => setSearchOpen(true)}
                aria-label={t('searchbox.placeholder')}
              >
                <SearchIcon />
              </MapControlIconButton>
            )}
            <HamburgerMenu />
          </MobileActions>
        </MobileBar>
      )}
    </>
  );
};

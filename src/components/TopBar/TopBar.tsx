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
import { isDesktop, useMobileMode } from '../helpers';
import { useAddNewCragContext } from '../Map/HamburgerMenu/AddNewCrag/AddNewCragContext';
import { HamburgerMenu } from '../Map/HamburgerMenu/HamburgerMenu';
import { SEARCH_BOX_HEIGHT } from '../SearchBox/consts';
import { SearchField } from '../SearchBox/SearchBox';
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
const navButtonSx = (active: boolean, compact: boolean) =>
  ({
    whiteSpace: 'nowrap',
    textTransform: 'none',
    textDecoration: 'none',
    fontSize: compact ? 14 : 15,
    minWidth: 'auto',
    px: compact ? 1 : undefined,
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
  compact?: boolean;
  target?: string;
  onClick?: (e: React.MouseEvent) => void;
};

const NavButton = ({
  label,
  href,
  active = false,
  compact = false,
  target,
  onClick,
}: NavButtonProps) => (
  <NavItem $active={active}>
    <Button
      component={Link}
      href={href}
      target={target}
      onClick={onClick}
      sx={navButtonSx(active, compact)}
    >
      {label}
    </Button>
  </NavItem>
);

// tighter icons so the two nav links still fit on a narrow phone
const MobileActions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;

  .MuiIconButton-root {
    padding: 6px;
  }
`;

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
  const { persistShowHomepage } = useFeatureContext();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    persistShowHomepage();
  };

  return (
    <BrandLink href="/" onClick={handleClick} aria-label="OpenClimbing">
      <LogoOpenClimbing width={36} style={{ minWidth: 36 }} />
    </BrandLink>
  );
};

// on mobile only climbing areas stay in the bar; about + community are in the menu
const NavLinks = ({ compact = false }: { compact?: boolean }) => {
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
      alignItems="center"
      alignSelf="stretch"
      spacing={compact ? 0 : 0.5}
      minWidth={0}
    >
      <NavButton
        label={t('topbar.climbing_areas')}
        href="/"
        onClick={openHomepage}
        active={areasActive}
        compact={compact}
      />
      {!compact && (
        <>
          <NavButton
            label={t('topbar.about')}
            href="/about"
            active={aboutActive}
          />
          <NavButton
            label={t('topbar.community')}
            href={COMMUNITY_URL}
            target="_blank"
          />
        </>
      )}
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
  const isMobileMode = useMobileMode();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  // The directions page brings its own top-left search UI.
  const isDirections = router.asPath.startsWith('/directions');

  if (isMobileMode) {
    if (searchOpen && !isDirections) {
      return (
        <Bar $transparent>
          <SearchSlot>
            <SearchField autoFocus />
          </SearchSlot>
          <IconButton
            onClick={() => setSearchOpen(false)}
            aria-label={t('close_panel')}
          >
            <CloseIcon />
          </IconButton>
        </Bar>
      );
    }

    return (
      <Bar $transparent>
        <Brand />
        <NavLinks compact />
        <Box sx={{ flexGrow: 1 }} />
        <MobileActions>
          {!isDirections && (
            <IconButton
              onClick={() => setSearchOpen(true)}
              aria-label={t('searchbox.placeholder')}
            >
              <SearchIcon />
            </IconButton>
          )}
          <HamburgerMenu />
        </MobileActions>
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
      <HamburgerMenu />
    </Bar>
  );
};

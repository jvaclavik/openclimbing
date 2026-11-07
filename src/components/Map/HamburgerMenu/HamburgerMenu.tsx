import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import { isModifiedClick, useBoolState, useMobileMode } from '../../helpers';
import { t } from '../../../services/intl';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useMapStateContext } from '../../utils/MapStateContext';
import { getIdEditorLink } from '../../FeaturePanel/helpers/externalLinks';
import { UserTheme, useUserThemeContext } from '../../../helpers/theme';
import { LangSwitcher } from './LangSwitcher';
import { HamburgerMenuButton } from './HamburgerMenuButton';
import { PROJECT_ID } from '../../../services/project';
import ViewListIcon from '@mui/icons-material/ViewList';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';
import { UserHeader } from './UserHeader';
import { MyClimbingProfileMenuItem } from './MyClimbingProfileMenuItem';
import { MyListsSection } from './MyListsSection';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import ContrastIcon from '@mui/icons-material/Contrast';
import { UserSettingsDialog } from '../../HomepagePanel/UserSettingsDialog';
import { Theme, ThemeProvider } from '@mui/material/styles';
import {
  HAMBURGER_DRAWER_Z,
  HAMBURGER_OVERLAY_Z,
} from '../../utils/mapChromeRegistry';
import { COMMUNITY_URL } from '../../consts';
import { HAS_USER_DB } from '../../../services/osm/consts';

const useIsBrowser = () => {
  // fixes hydration error - server and browser have different view (cookies and window.hash)
  const [browser, setBrowser] = useState(false);
  useEffect(() => {
    setBrowser(true);
  }, []);
  return browser;
};

const MenuIntro = () => (
  <Box sx={{ px: 2, pt: 2.5, pb: 1 }}>
    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
      Klettersteig-Karte
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Für Simon und Mama
    </Typography>
  </Box>
);

const SettingsRow = ({ open }: { open: () => void }) => (
  <ListItemButton onClick={open}>
    <ListItemIcon>
      <SettingsIcon />
    </ListItemIcon>
    <ListItemText
      primary="Einstellungen"
      secondary="Darstellung und Einheiten"
    />
  </ListItemButton>
);

const EditLink = () => {
  const browser = useIsBrowser();
  const { view } = useMapStateContext();
  const { feature } = useFeatureContext();
  const href = getIdEditorLink(feature, browser ? view : undefined);
  return (
    <ListItemButton component="a" href={href} target="_blank">
      <ListItemIcon>
        <CreateIcon />
      </ListItemIcon>
      <ListItemText>{t('map.edit_link')}</ListItemText>
    </ListItemButton>
  );
};

const ClimbingGradesTableLink = ({ closeMenu }) => (
  <ListItemButton href="/climbing-grades" component={Link} onClick={closeMenu}>
    <ListItemIcon>
      <ViewListIcon />
    </ListItemIcon>
    <ListItemText>{t('climbing_grade_table.title')}</ListItemText>
  </ListItemButton>
);
const TickScoringLink = ({ closeMenu }) => (
  <ListItemButton href="/tick-scoring" component={Link} onClick={closeMenu}>
    <ListItemIcon>
      <EmojiEventsIcon />
    </ListItemIcon>
    <ListItemText>{t('tick_scoring.menu_link')}</ListItemText>
  </ListItemButton>
);
const ClimbingLeaderboardLink = ({ closeMenu }) => (
  <ListItemButton
    href="/climbing-leaderboard"
    component={Link}
    onClick={closeMenu}
  >
    <ListItemIcon>
      <LeaderboardIcon />
    </ListItemIcon>
    <ListItemText>{t('leaderboard.menu_link')}</ListItemText>
  </ListItemButton>
);
const CommunityForumLink = ({ closeMenu }) => (
  <ListItemButton href={COMMUNITY_URL} component="a" onClick={closeMenu}>
    <ListItemIcon>
      <QuestionAnswerIcon />
    </ListItemIcon>
    <ListItemText>{t('climbing.forum')}</ListItemText>
  </ListItemButton>
);

const ClimbingAreasLink = ({ closeMenu }) => {
  const { persistShowHomepage } = useFeatureContext();

  return (
    <ListItemButton
      href="/"
      component={Link}
      onClick={(e) => {
        if (isModifiedClick(e)) return;
        e.preventDefault();
        persistShowHomepage();
        closeMenu();
      }}
    >
      <ListItemIcon>
        <MapOutlinedIcon />
      </ListItemIcon>
      <ListItemText
        primary={t('topbar.climbing_areas')}
        secondary="Alle Klettergebiete"
      />
    </ListItemButton>
  );
};

const AboutLink = ({ closeMenu }) => (
  <ListItemButton href="/about" component={Link} onClick={closeMenu}>
    <ListItemIcon>
      <InfoOutlinedIcon />
    </ListItemIcon>
    <ListItemText
      primary={t('topbar.about')}
      secondary="Wofür die Karte da ist"
    />
  </ListItemButton>
);

const themeOptions = {
  system: {
    icon: ContrastIcon,
    label: t('darkmode_auto'),
    next: 'dark' as UserTheme,
  },
  dark: {
    icon: DarkModeIcon,
    label: t('darkmode_on'),
    next: 'light' as UserTheme,
  },
  light: {
    icon: LightModeIcon,
    label: t('darkmode_off'),
    next: 'system' as UserTheme,
  },
};

const ThemeSelection = () => {
  const { userTheme, setUserTheme } = useUserThemeContext();
  const option = themeOptions[userTheme];
  const handleClick = () => {
    setUserTheme(option.next);
  };

  return (
    <Tooltip title={option.label}>
      <IconButton onClick={handleClick}>
        <option.icon />
      </IconButton>
    </Tooltip>
  );
};

// MUI has no modal stacking - everything opened from inside the drawer would
// render at theme.zIndex.modal (1300), ie. under the drawer itself
const overlayTheme = (theme: Theme) => ({
  ...theme,
  zIndex: {
    ...theme.zIndex,
    modal: HAMBURGER_OVERLAY_Z,
    tooltip: HAMBURGER_OVERLAY_Z + 1,
  },
});

// TODO custom Item components are not keyboard accesible
// seems like a bug in material-ui
// https://github.com/mui-org/material-ui/issues/22912
// https://github.com/mui-org/material-ui/issues?q=is%3Aissue+is%3Aopen+menuitem+keyboard

export const HamburgerMenu = () => {
  const anchorRef = useRef();
  const [opened, open, close] = useBoolState(false);
  const [userSettingsOpened, openUserSettings, closeUserSettings] =
    useBoolState(false);
  const isMobileMode = useMobileMode();
  const isOpenClimbing = PROJECT_ID === 'openclimbing';
  const { activeLayers } = useMapStateContext();
  const hasClimbingLayer = activeLayers.includes('climbing');
  const { loggedIn } = useOsmAuthContext();

  const handleOpenUserSettings = () => {
    close();
    openUserSettings();
  };

  return (
    <>
      <UserSettingsDialog
        isOpened={userSettingsOpened}
        onClose={closeUserSettings}
      />

      <Drawer
        open={opened}
        onClose={close}
        anchor="right"
        // above map controls (1300) and the layers panel (1200)
        sx={{ zIndex: HAMBURGER_DRAWER_Z }}
      >
        <ThemeProvider theme={overlayTheme}>
          <Stack
            direction="column"
            sx={{
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <MenuIntro />
              {HAS_USER_DB ? (
                <UserHeader
                  closeMenu={close}
                  openUserSettings={handleOpenUserSettings}
                />
              ) : (
                <SettingsRow open={handleOpenUserSettings} />
              )}
              <Divider sx={{ mt: 1, mb: 2 }} />
              {isOpenClimbing && HAS_USER_DB && (
                <MyClimbingProfileMenuItem closeMenu={close} />
              )}
              <ClimbingAreasLink closeMenu={close} />
              <AboutLink closeMenu={close} />
              {(!HAS_USER_DB || loggedIn) && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <MyListsSection closeMenu={close} />
                  <Divider sx={{ my: 1 }} />
                </>
              )}
              {(hasClimbingLayer || isOpenClimbing) && (
                <>
                  <ClimbingGradesTableLink closeMenu={close} />
                  {HAS_USER_DB && <TickScoringLink closeMenu={close} />}
                  {isOpenClimbing && HAS_USER_DB && (
                    <ClimbingLeaderboardLink closeMenu={close} />
                  )}
                </>
              )}
              {HAS_USER_DB && isMobileMode && (
                <CommunityForumLink closeMenu={close} />
              )}
            </div>
            <div>
              <Divider />
              <Box
                sx={{
                  mb: 2,
                }}
              >
                {HAS_USER_DB && <EditLink />}
              </Box>
              <Divider />
              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  mb: 1,
                  mt: 1,
                }}
              >
                <LangSwitcher />
                <div>
                  <ThemeSelection />
                </div>
              </Stack>
            </div>
          </Stack>
        </ThemeProvider>
      </Drawer>

      <HamburgerMenuButton anchorRef={anchorRef} onClick={open} />
    </>
  );
};

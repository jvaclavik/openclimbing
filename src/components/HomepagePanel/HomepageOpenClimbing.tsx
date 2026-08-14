import styled from '@emotion/styled';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { Box, Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import React from 'react';
import GithubIcon from '../../assets/GithubIcon';
import { LogoMaptiler } from '../../assets/LogoMaptiler';
import { intl, t } from '../../services/intl';
import { isMobileMode, useMobileMode } from '../helpers';
import { useAddNewCragContext } from '../Map/HamburgerMenu/AddNewCrag/AddNewCragContext';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { DRAWER_MOTION } from '../utils/drawerSnap';
import { useMapChrome } from '../utils/mapChromeRegistry';
import {
  ClimbingNumbers,
  GradientHeading,
  SectionHeading,
  useClimbingStats,
} from '../utils/panelUi';
import {
  PANEL_GAP,
  PanelContent,
  PanelScrollbars,
} from '../utils/PanelHelpers';
import { HomepageOpenClimbingGallery } from './HomepageOpenClimbingGallery';

const Content = styled.div`
  height: 100%;
  padding: 20px 2em 0 2em;
`;

/** CSS media hide/show – avoids useMediaQuery SSR flashes. */
const MobileOnly = styled.div`
  display: none;
  @media ${isMobileMode} {
    display: block;
  }
`;

const DesktopOnly = styled.div`
  @media ${isMobileMode} {
    display: none;
  }
`;

const Brand = styled(GradientHeading, {
  shouldForwardProp: (prop) => prop !== '$peek',
})<{ $peek?: boolean }>`
  text-align: center;
  font-size: ${({ $peek }) => ($peek ? '32px' : '46px')};
  line-height: ${({ $peek }) => ($peek ? 1.15 : 1.2)};
  transition:
    font-size ${DRAWER_MOTION},
    transform ${DRAWER_MOTION};
  transform: translateY(${({ $peek }) => ($peek ? '0' : '10px')});
`;

/** Peek: compact + centered in the strip. Expanded: larger, slightly lower. */
const BrandBar = styled.div<{ $peek: boolean }>`
  position: sticky;
  top: 0;
  z-index: 5;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  // equal side padding so the title stays optically centered next to close
  padding: ${({ $peek }) => ($peek ? '0 48px 2px' : `${PANEL_GAP} 48px 8px`)};
  background: ${({ theme }) => theme.palette.background.paper};
  transition: padding ${DRAWER_MOTION};
`;

const Subtitle = () => (
  <Typography
    component="p"
    variant="subtitle2"
    color="secondary"
    textTransform="lowercase"
  >
    {t('project.openclimbing.description')}
  </Typography>
);

const Description = () => (
  <Typography
    variant="body2"
    component="p"
    color="text.secondary"
    sx={{
      maxWidth: 380,
      mx: 'auto',
      mb: 3,
      lineHeight: 1.6,
      textAlign: 'center',
    }}
  >
    {t('homepage.openclimbing_description_p1')}{' '}
    <Box component="strong" color="text.primary">
      {t('homepage.openclimbing_description_p2')}
    </Box>
  </Typography>
);

const STORY_URL = (lang) =>
  lang === 'cs'
    ? 'https://medium.com/@jvaclavik/p%C5%99%C3%ADb%C4%9Bh-za-openclimbing-org-e1e2b3de2024'
    : 'https://medium.com/@jvaclavik/story-behind-openclimbing-org-ab448939c6ac';

const Buttons = ({ onClose }) => {
  const { start } = useAddNewCragContext();

  const addNewCrag = () => {
    onClose();
    start({ ignorePanel: true });
  };

  return (
    <Stack spacing={1} mt={4}>
      <MobileOnly>
        <Button
          variant="contained"
          color="primary"
          endIcon={<ChevronRightIcon />}
          onClick={onClose}
          fullWidth
          size="large"
        >
          {t('homepage.go_to_map_button')}
        </Button>
      </MobileOnly>
      <Button
        variant="outlined"
        color="primary"
        size="large"
        fullWidth
        startIcon={<AddLocationAltIcon />}
        onClick={addNewCrag}
      >
        {t('add_new_crag.menu_link')}
      </Button>
      <Stack direction="row" spacing={1}>
        <Button
          variant="text"
          color="secondary"
          fullWidth
          startIcon={<MenuBookIcon />}
          href={STORY_URL(intl.lang)}
          target="_blank"
        >
          {t('homepage.our_story')}
        </Button>
        <Button
          variant="text"
          color="secondary"
          fullWidth
          startIcon={<QuestionAnswerIcon />}
          href="https://community.openclimbing.org"
          target="_blank"
        >
          {t('climbing.forum')}
        </Button>
      </Stack>
    </Stack>
  );
};

const StyledGithubIcon = styled(GithubIcon)`
  display: block;
  filter: ${({ theme }) => theme.palette.invertFilter};
`;

const FooterLink = styled.a`
  display: flex;
  align-items: center;
`;

const GithubLink = styled(FooterLink)`
  opacity: 0.65;

  &:hover {
    opacity: 1;
  }
`;

const Gallery = () => (
  <Box mt={4}>
    <SectionHeading centered>{t('homepage.gallery.title')}</SectionHeading>
    <HomepageOpenClimbingGallery />
    <Stack alignItems="center" mt={1}>
      <Button
        component={Link}
        href="/climbing-areas"
        locale={intl.lang}
        variant="text"
        size="small"
        endIcon={<ArrowForwardIcon />}
      >
        {t('homepage.discover_more')}
      </Button>
    </Stack>
  </Box>
);

const AboutTeaser = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 32px;
  padding: 18px 20px;
  border-radius: 16px;
  text-decoration: none !important;
  color: #fff;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.palette.primary.main} 0%,
    ${({ theme }) => theme.palette.background.searchBox} 100%
  );

  &:hover,
  &:focus {
    text-decoration: none !important;
    filter: brightness(1.06);
  }
`;

const AboutLink = () => (
  <AboutTeaser href="/about" locale={intl.lang}>
    <Stack spacing={0.5} minWidth={0}>
      <Typography variant="subtitle1" fontWeight={800} lineHeight={1.25}>
        {t('topbar.about')}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9 }} lineHeight={1.45}>
        {t('homepage.about_banner_desc')}
      </Typography>
    </Stack>
    <ArrowForwardIcon sx={{ flexShrink: 0 }} />
  </AboutTeaser>
);

const Footer = () => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    spacing={2}
    mt={5}
    pb={2}
  >
    <Stack direction="row" alignItems="center" spacing={2}>
      <FooterLink
        href="https://www.maptiler.com"
        target="_blank"
        aria-label="MapTiler"
        title="MapTiler"
      >
        <LogoMaptiler width={120} />
      </FooterLink>
      <GithubLink
        href="https://github.com/jvaclavik/openclimbing"
        target="_blank"
        aria-label={t('map.github_title')}
        title={t('map.github_title')}
      >
        <StyledGithubIcon width="22" />
      </GithubLink>
    </Stack>
    <Typography variant="caption" color="secondary" letterSpacing={1}>
      Made in Prague with ♥
    </Typography>
  </Stack>
);

export function HomepageOpenClimbing({ onClose }: { onClose: () => void }) {
  const stats = useClimbingStats();
  const isMobileMode = useMobileMode();
  // homepage drawer defaults to full – treat unknown (SSR / before mount) as expanded
  const { drawerSnap } = useMapChrome();
  const isPeek = drawerSnap === 'quarter';

  const body = (
    <>
      <MobileOnly>
        <BrandBar $peek={isPeek}>
          <Brand $peek={isPeek}>OpenClimbing</Brand>
        </BrandBar>
      </MobileOnly>
      <ClosePanelButton right onClick={onClose} />
      <Content>
        <Stack height="100%">
          <Stack flex={1} justifyContent="center">
            <Stack component="section" alignItems="center" mt={2} mb={2}>
              <DesktopOnly>
                <Brand>OpenClimbing</Brand>
              </DesktopOnly>
              <Subtitle />
            </Stack>
            <Description />
            <Gallery />
            <Box mt={3}>
              <ClimbingNumbers stats={stats} />
            </Box>
            <Buttons onClose={onClose} />
          </Stack>

          <AboutLink />
          <Footer />
        </Stack>
      </Content>
    </>
  );

  return (
    <PanelContent $grow={isMobileMode}>
      {isMobileMode ? body : <PanelScrollbars>{body}</PanelScrollbars>}
    </PanelContent>
  );
}

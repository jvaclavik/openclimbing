import styled from '@emotion/styled';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { Box, Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import React, { ReactNode } from 'react';
import GithubIcon from '../../assets/GithubIcon';
import { LogoMaptiler } from '../../assets/LogoMaptiler';
import { intl, t } from '../../services/intl';
import { useMobileMode } from '../helpers';
import { useAddNewCragContext } from '../Map/HamburgerMenu/AddNewCrag/AddNewCragContext';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { PanelContent, PanelScrollbars } from '../utils/PanelHelpers';
import { DividerOpenClimbing } from './DividerOpenClimbing';
import { HomepageOpenClimbingGallery } from './HomepageOpenClimbingGallery';
import { LinkCard, LinkRow } from './LinkCard';
import { SupportUs } from './SupportUs';

const Divider = styled.div`
  align-items: center;
  display: flex;
  margin: 40px -32px 24px -32px;
`;

const Content = styled.div`
  height: 100%;
  padding: 20px 2em 0 2em;
`;

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="overline"
    component="h2"
    color="text.secondary"
    sx={{ display: 'block', mb: 1, fontWeight: 700, letterSpacing: 1.5 }}
  >
    {children}
  </Typography>
);

const Header = () => {
  const isMobileMode = useMobileMode();

  return (
    <Stack
      component="section"
      alignItems={isMobileMode ? 'flex-start' : 'center'}
      sx={{
        mt: isMobileMode ? 1 : 4,
        mb: 2,
      }}
    >
      <Typography
        component="h1"
        variant="h2"
        color="inherit"
        fontWeight={600}
        lineHeight={1.1}
      >
        OpenClimbing
      </Typography>
      <Typography
        component="p"
        variant="subtitle2"
        color="secondary"
        textTransform="lowercase"
      >
        {t('project.openclimbing.description')}
      </Typography>
    </Stack>
  );
};

const Description = () => {
  const isMobileMode = useMobileMode();

  return (
    <Typography
      variant="body2"
      component="p"
      color="text.secondary"
      sx={{
        maxWidth: 380,
        mx: 'auto',
        lineHeight: 1.6,
        textAlign: isMobileMode ? 'left' : 'center',
      }}
    >
      {t('homepage.openclimbing_description_p1')}{' '}
      <Box component="strong" color="text.primary">
        {t('homepage.openclimbing_description_p2')}
      </Box>
    </Typography>
  );
};

const AboutOpenStreetMap = () => (
  <Typography variant="body2">
    {t('homepage.climbing.expanded_description_p1')}{' '}
    <Link href="https://wikipedia.org/wiki/OpenStreetMap" target="_blank">
      OpenStreetMap
    </Link>{' '}
    {t('homepage.climbing.expanded_description_p2')}{' '}
    <Link href="https://wikipedia.org/wiki/Wikimedia_Commons" target="_blank">
      Wikimedia Commons
    </Link>
    {t('homepage.climbing.expanded_description_p3')}
  </Typography>
);

const STORY_URL = (lang) =>
  lang === 'cs'
    ? 'https://medium.com/@jvaclavik/p%C5%99%C3%ADb%C4%9Bh-za-openclimbing-org-e1e2b3de2024'
    : 'https://medium.com/@jvaclavik/story-behind-openclimbing-org-ab448939c6ac';

const Buttons = ({ onClose }) => {
  const isMobileMode = useMobileMode();
  const { start } = useAddNewCragContext();

  const addNewCrag = () => {
    onClose();
    start({ ignorePanel: true });
  };

  return (
    <Stack spacing={1} mt={3}>
      {isMobileMode && (
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
      )}
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
  opacity: 0.65;

  &:hover {
    opacity: 1;
  }
`;

const Gallery = () => (
  <Box mt={4}>
    <SectionHeading>{t('homepage.gallery.title')}</SectionHeading>
    <HomepageOpenClimbingGallery />
    <Button
      component={Link}
      href="/climbing-areas"
      locale={intl.lang}
      variant="text"
      fullWidth
      endIcon={<ArrowForwardIcon />}
      sx={{ mt: 1 }}
    >
      {t('homepage.discover_more')}
    </Button>
  </Box>
);

const ImportantLinks = () => (
  <>
    <LinkCard>
      <LinkRow
        icon={<img src="/logo-osm.svg" alt="OpenStreetMap logo" width={24} />}
        title="OpenStreetMap"
      >
        <AboutOpenStreetMap />
      </LinkRow>
    </LinkCard>
    <SupportUs />
  </>
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
      <a
        href="https://www.maptiler.com"
        target="_blank"
        aria-label="MapTiler"
        title="MapTiler"
      >
        <LogoMaptiler width={120} />
      </a>
      <FooterLink
        href="https://github.com/jvaclavik/openclimbing"
        target="_blank"
        aria-label={t('map.github_title')}
        title={t('map.github_title')}
      >
        <StyledGithubIcon width="22" />
      </FooterLink>
    </Stack>
    <Typography variant="caption" color="secondary" letterSpacing={1}>
      Made in Prague with ♥
    </Typography>
  </Stack>
);

export function HomepageOpenClimbing({ onClose }: { onClose: () => void }) {
  return (
    <PanelContent>
      <PanelScrollbars>
        <ClosePanelButton right onClick={onClose} />
        <Content>
          <Stack height="100%">
            <Stack flex={1} justifyContent="center">
              <Header />
              <Description />
              <Buttons onClose={onClose} />
              <Gallery />
            </Stack>

            <Divider>
              <DividerOpenClimbing width="100%" />
            </Divider>

            <ImportantLinks />
            <Footer />
          </Stack>
        </Content>
      </PanelScrollbars>
    </PanelContent>
  );
}

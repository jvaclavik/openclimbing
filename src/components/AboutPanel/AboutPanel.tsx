import styled from '@emotion/styled';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Typography } from '@mui/material';
import Router from 'next/router';
import React from 'react';
import { intl, t } from '../../services/intl';
import { useMobileMode } from '../helpers';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import {
  ArrowLink,
  ArrowLinkInternal,
  GradientHeading,
} from '../utils/panelUi';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { AboutFeatures } from './AboutFeatures';
import { AboutOpenData } from './AboutOpenData';
import { AboutSupport } from './AboutSupport';
import { OpenPointsCard } from './OpenPointsCard';

const storyUrl = (lang: string) =>
  lang === 'cs'
    ? 'https://medium.com/@jvaclavik/p%C5%99%C3%ADb%C4%9Bh-za-openclimbing-org-e1e2b3de2024'
    : 'https://medium.com/@jvaclavik/story-behind-openclimbing-org-ab448939c6ac';

const StoryLink = styled(ArrowLink)`
  margin-top: 14px;
`;

const ExportLink = styled(ArrowLinkInternal)`
  margin-top: 14px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const Hero = () => (
  <Box
    sx={{
      mt: 4,
    }}
  >
    <GradientHeading>{t('about.hero_claim')}</GradientHeading>
    <Typography
      variant="body1"
      sx={{
        color: 'text.secondary',
        mt: 1.5,
        lineHeight: 1.7,
      }}
    >
      {t('about.hero_sub')}
    </Typography>
    <StoryLink
      href={storyUrl(intl.lang)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('homepage.our_story')}
      <ArrowForwardIcon sx={{ fontSize: 16 }} />
    </StoryLink>
  </Box>
);

const Section = ({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      mt: 5,
    }}
  >
    <Typography
      variant="h5"
      component="h2"
      sx={{
        fontWeight: 800,
        letterSpacing: -0.4,
        lineHeight: 1.25,
      }}
    >
      {title}
    </Typography>
    {lead && (
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mt: 1.25,
          mb: 2,
          lineHeight: 1.7,
        }}
      >
        {lead}
      </Typography>
    )}
    {children}
  </Box>
);

const Different = () => (
  <Section
    title={t('about.different_heading')}
    lead={t('about.different_lead')}
  >
    <OpenPointsCard>
      <ExportLink href="/export">
        {t('about.export_cta')}
        <ArrowForwardIcon sx={{ fontSize: 16 }} />
      </ExportLink>
    </OpenPointsCard>
  </Section>
);

export const AboutPanel = () => {
  const isMobileMode = useMobileMode();
  const handleClose = () => {
    Router.push('/');
  };

  const body = (
    <PanelSidePadding>
      <ClosePanelButton right onClick={handleClose} />
      <Hero />
      <Section
        title={t('about.features_heading')}
        lead={t('about.features_lead')}
      >
        <AboutFeatures />
      </Section>
      <Section title={t('about.open_heading')} lead={t('about.open_lead')}>
        <AboutOpenData />
      </Section>
      <Different />
      <AboutSupport />
    </PanelSidePadding>
  );

  return (
    <MobilePageDrawer className="about-drawer">
      <PanelContent $grow={isMobileMode}>
        {isMobileMode ? body : <PanelScrollbars>{body}</PanelScrollbars>}
      </PanelContent>
    </MobilePageDrawer>
  );
};

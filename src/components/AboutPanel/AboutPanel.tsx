import styled from '@emotion/styled';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Stack, Typography } from '@mui/material';
import Router from 'next/router';
import React from 'react';
import { intl, t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { useMobileMode } from '../helpers';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { GradientHeading, TintedCard } from '../utils/panelUi';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { AboutFeatures } from './AboutFeatures';
import { AboutOpenData } from './AboutOpenData';
import { AboutSupport } from './AboutSupport';

const US_POINTS = ['1', '2', '3'] as const;

const storyUrl = (lang: string) =>
  lang === 'cs'
    ? 'https://medium.com/@jvaclavik/p%C5%99%C3%ADb%C4%9Bh-za-openclimbing-org-e1e2b3de2024'
    : 'https://medium.com/@jvaclavik/story-behind-openclimbing-org-ab448939c6ac';

const StoryLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  color: ${({ theme }) => theme.palette.primary.main};
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.2px;
  text-decoration: none !important;
  background-image: linear-gradient(currentColor, currentColor);
  background-position: 0 100%;
  background-repeat: no-repeat;
  background-size: 0 1.5px;
  transition:
    background-size 0.22s ease,
    gap 0.22s ease;

  &:hover,
  &:focus {
    text-decoration: none !important;
    background-size: 100% 1.5px;
    gap: 8px;
  }
`;

const Hero = () => (
  <Box mt={4}>
    <GradientHeading>{t('about.hero_claim')}</GradientHeading>
    <Typography
      variant="body1"
      color="text.secondary"
      mt={1.5}
      lineHeight={1.7}
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
  <Box mt={5}>
    <Typography
      variant="h5"
      component="h2"
      fontWeight={800}
      letterSpacing={-0.4}
      lineHeight={1.25}
    >
      {title}
    </Typography>
    {lead && (
      <Typography
        variant="body1"
        color="text.secondary"
        mt={1.25}
        mb={2}
        lineHeight={1.7}
      >
        {lead}
      </Typography>
    )}
    {children}
  </Box>
);

const UsCard = styled(TintedCard)`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.palette.primary.main};
`;

const Point = ({ children }: { children: React.ReactNode }) => (
  <Stack direction="row" spacing={1.25} alignItems="flex-start" mt={1}>
    <CheckIcon color="primary" sx={{ fontSize: 20, mt: '1px' }} />
    <Typography variant="body2" fontWeight={600} lineHeight={1.5}>
      {children}
    </Typography>
  </Stack>
);

const Different = () => (
  <Section
    title={t('about.different_heading')}
    lead={t('about.different_lead')}
  >
    <UsCard>
      <Typography variant="caption" color="primary" fontWeight={700}>
        {t('about.different_us')}
      </Typography>
      {US_POINTS.map((index) => (
        <Point key={index}>
          {t(`about.compare_us_${index}` as TranslationId)}
        </Point>
      ))}
    </UsCard>
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

import styled from '@emotion/styled';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import CheckIcon from '@mui/icons-material/Check';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { Box, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import Router from 'next/router';
import React from 'react';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { useMobileMode } from '../helpers';
import { useAddNewCragContext } from '../Map/HamburgerMenu/AddNewCrag/AddNewCragContext';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { GradientHeading, tint, TintedCard } from '../utils/panelUi';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { AboutFeatures } from './AboutFeatures';
import { AboutOpenData } from './AboutOpenData';
import { AboutSupport } from './AboutSupport';

const COMMUNITY_URL = 'https://community.openclimbing.org';
const FEEDBACK_EMAIL = 'jvaclavik@gmail.com';
const US_POINTS = ['1', '2', '3'] as const;

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

const CtaCard = styled.div`
  margin-top: 40px;
  padding: 22px 20px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => tint(theme, 0.07)},
    ${({ theme }) => tint(theme, 0.02)}
  );
`;

const Cta = () => {
  const { start } = useAddNewCragContext();

  const addNewCrag = () => {
    Router.push('/').then(() => start({ ignorePanel: true }));
  };

  return (
    <CtaCard>
      <Typography
        variant="h5"
        component="h2"
        fontWeight={800}
        letterSpacing={-0.4}
      >
        {t('about.cta_heading')}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        lineHeight={1.65}
        mt={1}
        mb={2}
      >
        {t('about.cta_p')}
      </Typography>
      <Stack spacing={1}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddLocationAltIcon />}
          onClick={addNewCrag}
        >
          {t('add_new_crag.menu_link')}
        </Button>
        <Button
          variant="text"
          color="secondary"
          startIcon={<QuestionAnswerIcon />}
          href={COMMUNITY_URL}
          target="_blank"
        >
          {t('climbing.forum')}
        </Button>
      </Stack>
    </CtaCard>
  );
};

const Feedback = () => (
  <Typography
    variant="body2"
    color="text.secondary"
    textAlign="center"
    mt={5}
    mb={3}
  >
    {t('support_us.feedback')}
    {': '}
    <MuiLink
      href={`mailto:${FEEDBACK_EMAIL}`}
      color="inherit"
      underline="hover"
    >
      {FEEDBACK_EMAIL}
    </MuiLink>
  </Typography>
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
      <Section title={t('about.open_heading')} lead={t('about.open_lead')}>
        <AboutOpenData />
      </Section>
      <Section
        title={t('about.features_heading')}
        lead={t('about.features_lead')}
      >
        <AboutFeatures />
      </Section>
      <Different />
      <Cta />
      <AboutSupport />
      <Feedback />
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

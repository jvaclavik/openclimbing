import styled from '@emotion/styled';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MapIcon from '@mui/icons-material/Map';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PublicIcon from '@mui/icons-material/Public';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import Router from 'next/router';
import React from 'react';
import { intl, t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import type { ClimbingStatsResponse } from '../../types';
import { useMobileMode } from '../helpers';
import { useAddNewCragContext } from '../Map/HamburgerMenu/AddNewCrag/AddNewCragContext';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import {
  ClimbingNumbers,
  GradientHeading,
  IconBubble,
  SectionHeading,
  tint,
  TintedCard,
  useClimbingStats,
} from '../utils/panelUi';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';

const FEATURES = [
  { icon: PublicIcon, key: 'open_data' },
  { icon: MenuBookIcon, key: 'guides' },
  { icon: PhotoLibraryIcon, key: 'photos' },
  { icon: EmojiEventsIcon, key: 'ticks' },
  { icon: MapIcon, key: 'map' },
  { icon: FavoriteIcon, key: 'free' },
] as const;

const COMPARED_GUIDES = ['paper', 'online'] as const;
const COMPARISON_ROWS = ['1', '2', '3'] as const;

const COMMUNITY_URL = 'https://community.openclimbing.org';

const Hero = () => (
  <Box mt={1} mb={4}>
    <GradientHeading>{t('about.hero_claim')}</GradientHeading>
    <Typography
      variant="body1"
      color="text.secondary"
      mt={1.5}
      lineHeight={1.6}
    >
      {t('about.hero_sub')}
    </Typography>
  </Box>
);

const AllAreasLink = () => (
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
);

const HighlightedCard = styled(TintedCard)`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.palette.primary.main};
`;

const CompareRow = ({
  children,
  positive,
}: {
  children: React.ReactNode;
  positive?: boolean;
}) => (
  <Stack direction="row" spacing={1} alignItems="center" mt={0.75}>
    {positive ? (
      <CheckIcon color="primary" sx={{ fontSize: 18 }} />
    ) : (
      <CloseIcon color="disabled" sx={{ fontSize: 18 }} />
    )}
    <Typography
      variant="body2"
      color={positive ? 'text.primary' : 'text.secondary'}
      fontWeight={positive ? 600 : 400}
    >
      {children}
    </Typography>
  </Stack>
);

const Comparison = () => (
  <Box mt={4}>
    <SectionHeading>{t('about.different_heading')}</SectionHeading>
    <Stack spacing={1}>
      {COMPARED_GUIDES.map((guide) => (
        <TintedCard key={guide}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {t(`about.compare_${guide}` as TranslationId)}
          </Typography>
          {COMPARISON_ROWS.map((index) => (
            <CompareRow key={index}>
              {t(`about.compare_${guide}_${index}` as TranslationId)}
            </CompareRow>
          ))}
        </TintedCard>
      ))}

      <HighlightedCard>
        <Typography variant="caption" color="primary" fontWeight={700}>
          OpenClimbing
        </Typography>
        {COMPARISON_ROWS.map((index) => (
          <CompareRow key={index} positive>
            {t(`about.compare_us_${index}` as TranslationId)}
          </CompareRow>
        ))}
      </HighlightedCard>
    </Stack>
  </Box>
);

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
`;

const FeatureTile = styled(TintedCard)`
  padding: 14px;
`;

const Features = () => (
  <Box mt={4}>
    <SectionHeading>{t('about.features_heading')}</SectionHeading>
    <FeatureGrid>
      {FEATURES.map(({ icon: Icon, key }) => (
        <FeatureTile key={key}>
          <IconBubble>
            <Icon fontSize="small" />
          </IconBubble>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            lineHeight={1.3}
            mt={1}
          >
            {t(`about.feature_${key}_title` as TranslationId)}
          </Typography>
          <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
            {t(`about.feature_${key}_desc` as TranslationId)}
          </Typography>
        </FeatureTile>
      ))}
    </FeatureGrid>
  </Box>
);

const CtaCard = styled.div`
  margin: 32px 0;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => tint(theme, 0.07)},
    ${({ theme }) => tint(theme, 0.02)}
  );
`;

const Cta = () => {
  const { start } = useAddNewCragContext();

  // the panel covers the map, so it has to close before the marker is dropped
  const addNewCrag = () => {
    Router.push('/').then(() => start({ ignorePanel: true }));
  };

  return (
    <CtaCard>
      <Typography variant="h4" component="h2" gutterBottom>
        {t('about.cta_heading')}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        lineHeight={1.6}
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

type AboutPanelProps = {
  stats?: ClimbingStatsResponse | null;
};

export const AboutPanel = ({ stats: initialStats = null }: AboutPanelProps) => {
  const stats = useClimbingStats(initialStats);
  const isMobileMode = useMobileMode();
  const handleClose = () => {
    Router.push('/');
  };

  const body = (
    <PanelSidePadding>
      <ClosePanelButton right onClick={handleClose} />
      <Hero />
      <ClimbingNumbers stats={stats} />
      <AllAreasLink />
      <Comparison />
      <Features />
      <Cta />
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

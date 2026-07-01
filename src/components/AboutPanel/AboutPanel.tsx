import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MapIcon from '@mui/icons-material/Map';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PublicIcon from '@mui/icons-material/Public';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import Router from 'next/router';
import React from 'react';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
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

const Section = ({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) => (
  <Box mt={4}>
    <Typography variant="h6" component="h2" gutterBottom>
      {heading}
    </Typography>
    {children}
  </Box>
);

const FeatureCard = ({
  Icon,
  title,
  description,
}: {
  Icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Icon color="primary" />
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const AboutPanel = () => {
  const handleClose = () => {
    Router.push('/');
  };

  return (
    <MobilePageDrawer className="about-drawer">
      <PanelContent>
        <PanelScrollbars>
          <PanelSidePadding>
            <PanelSidePadding>
              <ClosePanelButton right onClick={handleClose} />
              <h1>{t('about.title')}</h1>
            </PanelSidePadding>

            <Typography variant="body1" mt={2}>
              {t('about.intro')}
            </Typography>

            <Section heading={t('about.different_heading')}>
              <Typography variant="body1">{t('about.different_p')}</Typography>
            </Section>

            <Section heading={t('about.why_heading')}>
              <Typography variant="body1">{t('about.why_p')}</Typography>
            </Section>

            <Section heading={t('about.features_heading')}>
              <Stack spacing={1.5}>
                {FEATURES.map(({ icon: Icon, key }) => (
                  <FeatureCard
                    key={key}
                    Icon={Icon}
                    title={t(`about.feature_${key}_title` as TranslationId)}
                    description={t(
                      `about.feature_${key}_desc` as TranslationId,
                    )}
                  />
                ))}
              </Stack>
            </Section>

            <Stack spacing={1} mt={4} mb={4}>
              <Button
                variant="contained"
                color="primary"
                endIcon={<ChevronRightIcon />}
                href="https://medium.com/@jvaclavik/how-to-contribute-to-openclimbing-org-9a159ddd5d4c"
                target="_blank"
              >
                {t('about.cta_contribute')}
              </Button>
              <Button
                variant="text"
                startIcon={<QuestionAnswerIcon />}
                href="https://community.openclimbing.org"
                target="_blank"
              >
                {t('climbing.forum')}
              </Button>
            </Stack>
          </PanelSidePadding>
        </PanelScrollbars>
      </PanelContent>
    </MobilePageDrawer>
  );
};

import styled from '@emotion/styled';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import Router from 'next/router';
import React from 'react';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { activateTerrain3dPreview } from '../Map/Terrain3d/Terrain3d';
import { activateSunShadow } from '../Map/SunShadow/SunShadow';
import { tint } from '../utils/panelUi';

const closeAboutThen = (action: () => void) => {
  Router.push(`/${window.location.hash}`).then(action);
};

const trySunShadow = () => closeAboutThen(activateSunShadow);
const try3dMap = () => closeAboutThen(activateTerrain3dPreview);
const tryLeaderboard = () => Router.push('/climbing-leaderboard');

type FeatureKey =
  | 'shadows'
  | 'bolts'
  | '3d'
  | 'open_data'
  | 'mobile'
  | 'ticks'
  | 'pdf';

type FeatureDef = {
  key: FeatureKey;
  icon: SvgIconComponent;
  accent: string;
  wide?: boolean;
  onTry?: () => void;
  tryKey?: TranslationId;
};

const FEATURES: FeatureDef[] = [
  {
    key: 'open_data',
    icon: FavoriteIcon,
    accent: '#eb5757',
    wide: true,
  },
  {
    key: 'shadows',
    icon: WbSunnyIcon,
    accent: '#f5a623',
    wide: true,
    onTry: trySunShadow,
    tryKey: 'about.feature_shadows_try',
  },
  {
    key: '3d',
    icon: ThreeDRotationIcon,
    accent: '#00897b',
    wide: true,
    onTry: try3dMap,
    tryKey: 'about.feature_3d_try',
  },
  { key: 'bolts', icon: AutoAwesomeIcon, accent: '#7c4dff', wide: true },
  { key: 'mobile', icon: SmartphoneIcon, accent: '#43a047', wide: true },
  { key: 'pdf', icon: PictureAsPdfIcon, accent: '#8d6e63', wide: true },
  {
    key: 'ticks',
    icon: EmojiEventsIcon,
    accent: '#ec407a',
    onTry: tryLeaderboard,
    tryKey: 'about.feature_ticks_try',
  },
];

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const FeatureCard = styled('div', {
  shouldForwardProp: (prop) => prop !== '$accent' && prop !== '$wide',
})<{ $accent: string; $wide?: boolean }>`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
  display: flex;
  flex-direction: column;
  min-height: ${({ $wide }) => ($wide ? '168px' : '196px')};
  padding: 18px;
  border-radius: 18px;
  background: ${({ theme, $accent }) =>
    `linear-gradient(155deg, ${alpha(
      $accent,
      theme.palette.mode === 'dark' ? 0.38 : 0.22,
    )} 0%, ${alpha($accent, theme.palette.mode === 'dark' ? 0.1 : 0.05)} 42%, ${tint(
      theme,
      0.035,
    )} 100%)`};
  border: 1px solid ${({ $accent }) => alpha($accent, 0.28)};
  box-shadow:
    inset 0 1px 0
      ${({ theme }) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.7)'},
    0 8px 24px ${({ $accent }) => alpha($accent, 0.12)};

  &:nth-child(odd):last-child {
    grid-column: 1 / -1;
    min-height: 168px;
  }
`;

const Glow = styled('div', {
  shouldForwardProp: (prop) => prop !== '$accent',
})<{ $accent: string }>`
  position: absolute;
  right: -40px;
  top: -48px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${({ $accent }) => alpha($accent, 0.55)} 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
`;

const Watermark = styled('div', {
  shouldForwardProp: (prop) => prop !== '$accent',
})<{ $accent: string }>`
  position: absolute;
  right: -8px;
  bottom: -16px;
  color: ${({ $accent }) => $accent};
  opacity: 0.14;
  pointer-events: none;
  z-index: 0;
  transform: rotate(-12deg);
`;

const FeatureIcon = styled('div', {
  shouldForwardProp: (prop) => prop !== '$accent',
})<{ $accent: string }>`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: ${({ $accent }) => alpha($accent, 0.2)};
  color: ${({ $accent }) => $accent};
  box-shadow: 0 0 0 1px ${({ $accent }) => alpha($accent, 0.18)};
`;

const LearnMore = styled('button', {
  shouldForwardProp: (prop) => prop !== '$accent',
})<{ $accent: string }>`
  appearance: none;
  font: inherit;
  margin-top: auto;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  color: ${({ $accent }) => $accent};
  font-size: 0.92rem;
  font-weight: 800;
  background-image: linear-gradient(currentColor, currentColor);
  background-position: 0 100%;
  background-repeat: no-repeat;
  background-size: 0 1.5px;
  transition:
    background-size 0.22s ease,
    gap 0.22s ease;

  &:hover,
  &:focus {
    background-size: 100% 1.5px;
    gap: 8px;
  }
`;

const FeatureTile = ({ feature }: { feature: FeatureDef }) => {
  const Icon = feature.icon;

  return (
    <FeatureCard $accent={feature.accent} $wide={feature.wide}>
      <Glow $accent={feature.accent} />
      <Watermark $accent={feature.accent}>
        <Icon sx={{ fontSize: feature.wide ? 120 : 96 }} />
      </Watermark>
      <FeatureIcon $accent={feature.accent}>
        <Icon />
      </FeatureIcon>
      <Typography
        variant={feature.wide ? 'h6' : 'subtitle1'}
        fontWeight={800}
        lineHeight={1.2}
        mt={1.5}
        sx={{ position: 'relative', zIndex: 1, letterSpacing: -0.3 }}
      >
        {t(`about.feature_${feature.key}_title` as TranslationId)}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        lineHeight={1.5}
        mt={0.6}
        mb={feature.onTry ? 1.5 : 0}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        {t(`about.feature_${feature.key}_desc` as TranslationId)}
      </Typography>
      {feature.onTry && feature.tryKey && (
        <LearnMore
          type="button"
          $accent={feature.accent}
          onClick={feature.onTry}
        >
          {t(feature.tryKey)}
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </LearnMore>
      )}
    </FeatureCard>
  );
};

export const AboutFeatures = () => (
  <FeatureGrid>
    {FEATURES.map((feature) => (
      <FeatureTile key={feature.key} feature={feature} />
    ))}
  </FeatureGrid>
);

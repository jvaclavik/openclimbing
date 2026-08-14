import styled from '@emotion/styled';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CodeIcon from '@mui/icons-material/Code';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import React from 'react';
import { t } from '../../services/intl';
import { GITHUB_REPO_URL } from '../HomepagePanel/donationLinks';
import { tint } from '../utils/panelUi';

const OSM_ACCENT = '#7ebc6f';
const COMMONS_ACCENT = '#3366cc';
const OSM_WIKI = 'https://en.wikipedia.org/wiki/OpenStreetMap';
const OSM_SPEC =
  'https://wiki.openstreetmap.org/wiki/Key:wikimedia_commons:path';
const COMMONS_WIKI = 'https://en.wikipedia.org/wiki/Wikimedia_Commons';

const Grid = styled.div`
  display: grid;
  gap: 10px;
`;

const Card = styled('div', {
  shouldForwardProp: (prop) => prop !== '$accent',
})<{ $accent: string }>`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 176px;
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

const Watermark = styled.div`
  position: absolute;
  right: -4px;
  bottom: -18px;
  opacity: 0.16;
  pointer-events: none;
  z-index: 0;
  transform: rotate(-12deg);
  line-height: 0;
`;

const Badge = styled('div', {
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
  box-shadow: 0 0 0 1px ${({ $accent }) => alpha($accent, 0.18)};
`;

const Links = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-top: auto;
`;

const AccentLink = styled('a', {
  shouldForwardProp: (prop) => prop !== '$accent',
})<{ $accent: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ $accent }) => $accent};
  font-size: 0.92rem;
  font-weight: 800;
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

type TextLinkProps = {
  href: string;
  accent: string;
  children: React.ReactNode;
};

const TextLink = ({ href, accent, children }: TextLinkProps) => (
  <AccentLink
    href={href}
    $accent={accent}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
    <ArrowForwardIcon sx={{ fontSize: 16 }} />
  </AccentLink>
);

type PartnerCardProps = {
  accent: string;
  title: string;
  description: string;
  badge: React.ReactNode;
  watermark: React.ReactNode;
  links: { href: string; label: string }[];
};

const PartnerCard = ({
  accent,
  title,
  description,
  badge,
  watermark,
  links,
}: PartnerCardProps) => (
  <Card $accent={accent}>
    <Glow $accent={accent} />
    <Watermark>{watermark}</Watermark>
    <Badge $accent={accent}>{badge}</Badge>
    <Typography
      variant="h6"
      fontWeight={800}
      lineHeight={1.2}
      mt={1.5}
      sx={{ position: 'relative', zIndex: 1, letterSpacing: -0.3 }}
    >
      {title}
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      lineHeight={1.5}
      mt={0.6}
      mb={1.5}
      sx={{ position: 'relative', zIndex: 1 }}
    >
      {description}
    </Typography>
    <Links>
      {links.map((link) => (
        <TextLink key={link.href} href={link.href} accent={accent}>
          {link.label}
        </TextLink>
      ))}
    </Links>
  </Card>
);

export const AboutOpenData = () => (
  <Grid>
    <PartnerCard
      accent={OSM_ACCENT}
      title="OpenStreetMap"
      description={t('about.open_osm_desc')}
      badge={<img src="/logo-osm.svg" alt="" width={26} height={26} />}
      watermark={<img src="/logo-osm.svg" alt="" width={120} height={120} />}
      links={[
        { href: OSM_WIKI, label: t('about.open_osm_cta') },
        { href: OSM_SPEC, label: t('about.open_osm_spec') },
      ]}
    />
    <PartnerCard
      accent={COMMONS_ACCENT}
      title="Wikimedia Commons"
      description={t('about.open_commons_desc')}
      badge={<PhotoLibraryIcon sx={{ color: COMMONS_ACCENT }} />}
      watermark={
        <PhotoLibraryIcon sx={{ fontSize: 120, color: COMMONS_ACCENT }} />
      }
      links={[{ href: COMMONS_WIKI, label: t('about.open_commons_cta') }]}
    />
    <PartnerCard
      accent="#6e40c9"
      title="GitHub"
      description={t('about.open_github_desc')}
      badge={<CodeIcon sx={{ color: '#6e40c9' }} />}
      watermark={<CodeIcon sx={{ fontSize: 120, color: '#6e40c9' }} />}
      links={[{ href: GITHUB_REPO_URL, label: t('about.open_github_cta') }]}
    />
  </Grid>
);

import styled from '@emotion/styled';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DownloadIcon from '@mui/icons-material/Download';
import MapIcon from '@mui/icons-material/Map';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorageIcon from '@mui/icons-material/Storage';
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import Router from 'next/router';
import React from 'react';
import { useQuery } from 'react-query';
import {
  DB_EXPORT_URL,
  getDbExportInfo,
} from '../../services/climbing-tiles/getDbExportInfo';
import { t } from '../../services/intl';
import { OpenPointsCard } from '../AboutPanel/OpenPointsCard';
import { useMobileMode } from '../helpers';
import { GITHUB_REPO_URL } from '../HomepagePanel/donationLinks';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { ArrowLink, GradientHeading, TintedCard, tint } from '../utils/panelUi';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';

const SCHEMA_URL = `${GITHUB_REPO_URL}/blob/master/src/server/db/schema.sql`;
const DB_EXPORT_REPO_URL = 'https://github.com/zbycz/openclimbing-db-export';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? '< 1 MB' : `${Math.round(bytes / 1024 / 1024)} MB`;

const DownloadCard = styled.div`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-top: 20px;
  padding: 20px 18px 18px;
  border-radius: 18px;
  background: ${({ theme }) =>
    `linear-gradient(150deg, ${alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'dark' ? 0.32 : 0.16,
    )} 0%, ${tint(theme, 0.04)} 70%)`};
  border: 1px solid ${({ theme }) => alpha(theme.palette.primary.main, 0.35)};
`;

const Watermark = styled.div`
  position: absolute;
  right: -18px;
  bottom: -30px;
  color: ${({ theme }) => theme.palette.primary.main};
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
  transform: rotate(-12deg);
  line-height: 0;
`;

const Fact = ({
  icon: Icon,
  children,
}: {
  icon: SvgIconComponent;
  children: React.ReactNode;
}) => (
  <Stack
    direction="row"
    spacing={1.25}
    sx={{
      alignItems: 'flex-start',
      mt: 1.25,
      position: 'relative',
      zIndex: 1,
    }}
  >
    <Icon color="primary" sx={{ fontSize: 20, mt: '1px' }} />
    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
      {children}
    </Typography>
  </Stack>
);

const Download = () => {
  const { data: info, isLoading } = useQuery(
    ['dbExportInfo'],
    getDbExportInfo,
    {
      staleTime: 1000 * 60 * 5,
    },
  );

  const size = info ? formatSize(info.size) : undefined;

  return (
    <DownloadCard>
      <Watermark>
        <StorageIcon sx={{ fontSize: 150 }} />
      </Watermark>
      <Typography
        variant="h6"
        component="h2"
        sx={{
          fontWeight: 800,
          letterSpacing: -0.3,
          lineHeight: 1.2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {t('export.download_heading')}
      </Typography>
      <Fact icon={DataObjectIcon}>
        {t('export.download_format')}{' '}
        {isLoading && <Skeleton width={70} sx={{ display: 'inline-block' }} />}
        {size && t('export.download_size', { size })}
      </Fact>
      <Fact icon={ScheduleIcon}>{t('export.download_freshness')}</Fact>
      <Fact icon={MapIcon}>{t('export.download_contents')}</Fact>
      <form method="post" action={DB_EXPORT_URL}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<DownloadIcon />}
          sx={{
            mt: 2.5,
            py: 1.5,
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '1rem',
            textTransform: 'none',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {t('export.download_button')}
        </Button>
      </form>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          display: 'block',
          mt: 1.25,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {t('export.download_note')}
      </Typography>
    </DownloadCard>
  );
};

const LinkCard = ({
  title,
  description,
  cta,
  href,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
}) => (
  <TintedCard>
    <Typography
      variant="subtitle1"
      component="h3"
      sx={{
        fontWeight: 800,
        letterSpacing: -0.2,
      }}
    >
      {title}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: 'text.secondary',
        lineHeight: 1.6,
        mt: 0.5,
        mb: 1.25,
      }}
    >
      {description}
    </Typography>
    <ArrowLink href={href} target="_blank" rel="noopener noreferrer">
      {cta}
      <ArrowForwardIcon sx={{ fontSize: 16 }} />
    </ArrowLink>
  </TintedCard>
);

export const ExportPanel = () => {
  const isMobileMode = useMobileMode();
  const handleClose = () => {
    Router.push('/');
  };

  const body = (
    <PanelSidePadding>
      <ClosePanelButton right onClick={handleClose} />
      <Box sx={{ mt: 4 }}>
        <GradientHeading>{t('export.heading')}</GradientHeading>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mt: 1.5,
            mb: 2.5,
            lineHeight: 1.7,
          }}
        >
          {t('export.lead')}
        </Typography>
        <OpenPointsCard />
        <Download />
      </Box>
      <Box sx={{ mt: 5, mb: 4 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 800,
            letterSpacing: -0.4,
            lineHeight: 1.25,
            mb: 2,
          }}
        >
          {t('export.dev_heading')}
        </Typography>
        <Stack spacing={1.25}>
          <LinkCard
            title={t('export.schema_title')}
            description={t('export.schema_desc')}
            cta={t('export.schema_cta')}
            href={SCHEMA_URL}
          />
          <LinkCard
            title="openclimbing-db-export"
            description={t('export.repo_desc')}
            cta={t('export.repo_cta')}
            href={DB_EXPORT_REPO_URL}
          />
        </Stack>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            mt: 2,
            lineHeight: 1.6,
          }}
        >
          {t('export.license')}
        </Typography>
      </Box>
    </PanelSidePadding>
  );

  return (
    <MobilePageDrawer className="export-drawer">
      <PanelContent $grow={isMobileMode}>
        {isMobileMode ? body : <PanelScrollbars>{body}</PanelScrollbars>}
      </PanelContent>
    </MobilePageDrawer>
  );
};

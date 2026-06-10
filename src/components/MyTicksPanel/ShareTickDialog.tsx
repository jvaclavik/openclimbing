import React from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format, parseISO } from 'date-fns';
import styled from '@emotion/styled';
import { DEFAULT_DATA_FORMAT } from '../../config.mjs';
import { t } from '../../services/intl';
import { PROJECT_URL } from '../../services/project';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  buildSessionShareText,
  buildSingleTickShareText,
} from '../../services/my-ticks/buildShareText';
import { ActionButtons } from '../FeaturePanel/QuickActions/ShareDialog/ActionButtons';
import { useMobileMode } from '../helpers';
import {
  buildTickShareUrl,
  sessionDateFromTimestamp,
} from '../../services/my-ticks/ticksUrlFilter';
import { SessionRouteImagesGallery } from './SessionRouteImagesGallery';
import { buildSessionGpx } from '../../services/my-ticks/buildSessionGpx';
import DownloadIcon from '@mui/icons-material/Download';
import { Button } from '@mui/material';

export type ShareTickMode = 'session' | 'tick';

type Props = {
  open: boolean;
  onClose: () => void;
  mode: ShareTickMode;
  tick: FetchedClimbingTick;
  /** Required when mode === 'session'; ignored otherwise. */
  sessionTicks?: FetchedClimbingTick[];
  displayName: string;
};

const StyledLinkField = styled(TextField)`
  .MuiOutlinedInput-root {
    font-family: monospace;
    font-size: 0.875rem;
  }
`;

const StyledTextArea = styled(TextField)`
  .MuiOutlinedInput-root {
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const formatDateLabel = (iso: string): string => {
  try {
    return format(parseISO(iso), DEFAULT_DATA_FORMAT);
  } catch {
    return iso;
  }
};

type LinkSectionProps = {
  url: string;
  isMobileMode: boolean;
};

const ShareLinkSection = ({ url, isMobileMode }: LinkSectionProps) => (
  <Box mb={2}>
    <Typography variant="overline">{t('my_ticks.share.link_label')}</Typography>
    <Stack spacing={0}>
      <StyledLinkField
        fullWidth
        value={url}
        variant="outlined"
        size={isMobileMode ? 'small' : 'medium'}
        slotProps={{ input: { readOnly: true } }}
      />
      <Stack direction="row" alignItems="center" sx={{ pt: 0.5 }}>
        <div style={{ flex: 1 }} />
        <ActionButtons payload={url} type="url" />
      </Stack>
    </Stack>
  </Box>
);

type GpxSectionProps = {
  sessionDate: string;
  sessionTicks: FetchedClimbingTick[];
  shareText: string;
  commonAreaName: string | null;
  singleCragName: string | null;
};

const triggerGpxDownload = (xml: string, filename: string): void => {
  const blob = new Blob([xml], { type: 'application/gpx+xml' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const triggerGpxShareOrDownload = async (
  xml: string,
  filename: string,
  title: string,
): Promise<void> => {
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  if (canShareFiles) {
    const file = new File([xml], filename, {
      type: 'application/gpx+xml',
    });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        // Fall through to plain download on share errors.
      }
    }
  }
  triggerGpxDownload(xml, filename);
};

const ShareGpxSection = ({
  sessionDate,
  sessionTicks,
  shareText,
  commonAreaName,
  singleCragName,
}: GpxSectionProps) => {
  const isMobileMode = useMobileMode();
  const onClick = async () => {
    const { xml, filename, title } = buildSessionGpx({
      sessionDate,
      sessionTicks,
      description: shareText,
      commonAreaName,
      singleCragName,
    });
    if (isMobileMode) {
      await triggerGpxShareOrDownload(xml, filename, title);
    } else {
      triggerGpxDownload(xml, filename);
    }
  };

  return (
    <Box mb={2}>
      <Typography variant="overline">
        {t('my_ticks.share.gpx_label')}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ pt: 0.5 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={onClick}
        >
          {t('my_ticks.share.gpx_button')}
        </Button>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 0.5 }}
      >
        {t('my_ticks.share.gpx_hint')}
      </Typography>
    </Box>
  );
};

type TextSectionProps = {
  shareText: string;
  isMobileMode: boolean;
};

const ShareTextSection = ({ shareText, isMobileMode }: TextSectionProps) => (
  <Box mb={2}>
    <Typography variant="overline">{t('my_ticks.share.text_label')}</Typography>
    <Stack spacing={0}>
      <StyledTextArea
        fullWidth
        multiline
        minRows={6}
        maxRows={14}
        value={shareText}
        variant="outlined"
        size={isMobileMode ? 'small' : 'medium'}
        slotProps={{ input: { readOnly: true } }}
      />
      <Stack direction="row" alignItems="center" sx={{ pt: 0.5 }}>
        <div style={{ flex: 1 }} />
        <ActionButtons payload={shareText} type="text" />
      </Stack>
    </Stack>
  </Box>
);

const buildUrlForMode = (
  mode: ShareTickMode,
  tick: FetchedClimbingTick,
  displayName: string,
): string => {
  const sessionDate = sessionDateFromTimestamp(tick.date);
  return mode === 'session'
    ? buildTickShareUrl(PROJECT_URL, displayName, { session: sessionDate })
    : buildTickShareUrl(PROJECT_URL, displayName, {
        session: sessionDate,
        tickId: tick.tick.id,
      });
};

const buildTextForMode = (
  mode: ShareTickMode,
  tick: FetchedClimbingTick,
  sessionTicks: FetchedClimbingTick[] | undefined,
  displayName: string,
): string => {
  const sessionDate = sessionDateFromTimestamp(tick.date);
  return mode === 'session'
    ? buildSessionShareText({
        sessionDate,
        sessionTicks: sessionTicks ?? [tick],
        displayName,
        baseUrl: PROJECT_URL,
      })
    : buildSingleTickShareText({
        tick,
        displayName,
        baseUrl: PROJECT_URL,
      });
};

const buildTitleAndDescription = (
  mode: ShareTickMode,
  tickDateIso: string,
): { title: string; description: string } => {
  if (mode === 'session') {
    return {
      title: t('my_ticks.share.dialog_title_session', {
        date: formatDateLabel(tickDateIso),
      }),
      description: t('my_ticks.share.session_description'),
    };
  }
  return {
    title: t('my_ticks.share.dialog_title_tick'),
    description: t('my_ticks.share.tick_description'),
  };
};

export const ShareTickDialog = ({
  open,
  onClose,
  mode,
  tick,
  sessionTicks,
  displayName,
}: Props) => {
  const isMobileMode = useMobileMode();
  const url = buildUrlForMode(mode, tick, displayName);
  const shareText = buildTextForMode(mode, tick, sessionTicks, displayName);
  const { title, description } = buildTitleAndDescription(mode, tick.date);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullScreen={isMobileMode}
    >
      <DialogTitle>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ float: 'right' }}
          aria-label={t('my_ticks.share.close')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        {title}
      </DialogTitle>
      <DialogContent sx={isMobileMode ? undefined : { minWidth: 480 }}>
        <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
          {description}
        </Typography>
        <ShareLinkSection url={url} isMobileMode={isMobileMode} />
        <ShareTextSection shareText={shareText} isMobileMode={isMobileMode} />
        {mode === 'session' ? (
          <ShareGpxSection
            sessionDate={sessionDateFromTimestamp(tick.date)}
            sessionTicks={sessionTicks ?? [tick]}
            shareText={shareText}
            commonAreaName={tick.areaName ?? null}
            singleCragName={tick.cragName ?? null}
          />
        ) : null}
        <SessionRouteImagesGallery
          ticks={mode === 'session' ? (sessionTicks ?? [tick]) : [tick]}
        />
        <Alert severity="info" variant="outlined">
          {t('my_ticks.share.strava_hint')}
        </Alert>
      </DialogContent>
    </Dialog>
  );
};

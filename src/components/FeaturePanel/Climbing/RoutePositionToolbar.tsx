import React from 'react';
import maplibregl from 'maplibre-gl';
import styled from '@emotion/styled';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { t } from '../../../services/intl';
import { convertHexToRgba } from '../../utils/colorUtils';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { useCragRoutePositionEditor } from './utils/useCragRoutePositionEditor';

const ToolbarContainer = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  right: 152px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

const glassSurface = (theme: {
  palette: { background: { paper: string } };
}) => `
  background: ${convertHexToRgba(theme.palette.background.paper, 0.8)};
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
`;

const HelperPaper = styled.div`
  padding: 8px 8px 8px 12px;
  max-width: 360px;
  border-radius: 12px;
  color: ${({ theme }) => theme.palette.text.primary};
  ${({ theme }) => glassSurface(theme)};
`;

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GlassPillButton = styled.button`
  margin: 0;
  height: 40px;
  padding: 2px 12px 2px 10px;
  display: flex;
  gap: 6px;
  align-items: center;
  border: 0;
  outline: 0;
  border-radius: 40px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  color: ${({ theme }) => theme.palette.text.primary};
  ${({ theme }) => glassSurface(theme)};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.palette.background.paper};
  }

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .MuiTypography-root {
    font-size: 12px;
    line-height: 1.2;
    letter-spacing: 0.02em;
  }
`;

const GlassCircleButton = styled(IconButton, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{
  $tone?: 'primary' | 'destructive' | 'muted';
}>`
  width: 40px;
  height: 40px;
  padding: 0;
  ${({ theme, $tone }) =>
    $tone === 'primary'
      ? `
    color: ${theme.palette.primary.contrastText};
    background: ${theme.palette.primary.main};
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    &:hover {
      background: ${theme.palette.primary.dark};
    }
  `
      : `
    color: ${
      $tone === 'muted'
        ? theme.palette.text.secondary
        : theme.palette.text.primary
    };
    ${glassSurface(theme)}
    &:hover:not(.Mui-disabled) {
      background: ${theme.palette.background.paper};
    }
  `}

  &.Mui-disabled {
    opacity: 0.4;
    color: ${({ theme }) => theme.palette.text.primary};
    ${({ theme }) => glassSurface(theme)};
  }
`;

type Props = {
  mapRef: React.MutableRefObject<maplibregl.Map>;
  isMapLoaded: boolean;
  styleEpoch: number;
  showNames: boolean;
  showGrades: boolean;
};

export const RoutePositionToolbar = ({
  mapRef,
  isMapLoaded,
  styleEpoch,
  showNames,
  showGrades,
}: Props) => {
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const isHelpOpen = !(userSettings['editdialog.lineHelpDismissed'] ?? false);
  const setHelpDismissed = (dismissed: boolean) =>
    setUserSetting('editdialog.lineHelpDismissed', dismissed);
  const { isGuideMode, setIsGuideMode, clearGuide, controlPoints, hasRoutes } =
    useCragRoutePositionEditor(mapRef, isMapLoaded, styleEpoch, {
      showNames,
      showGrades,
    });

  if (!hasRoutes) return null;

  if (!isGuideMode) {
    return (
      <ToolbarContainer>
        <Tooltip title={t('climbing.distribute_along_line_tooltip')} arrow>
          <GlassPillButton type="button" onClick={() => setIsGuideMode(true)}>
            <TimelineIcon fontSize="small" />
            <Typography variant="button">
              {t('climbing.distribute_along_line')}
            </Typography>
          </GlassPillButton>
        </Tooltip>
      </ToolbarContainer>
    );
  }

  return (
    <ToolbarContainer>
      {isHelpOpen && (
        <HelperPaper>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Typography variant="body2">
              {t('climbing.route_positions_help')}
            </Typography>
            <Tooltip title={t('climbing.minimize_help')} arrow>
              <IconButton
                size="small"
                sx={{ mt: '-2px' }}
                onClick={() => setHelpDismissed(true)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </HelperPaper>
      )}
      <ButtonRow>
        <Tooltip title={t('climbing.done_drawing_line')} arrow>
          <GlassCircleButton
            $tone="primary"
            onClick={() => setIsGuideMode(false)}
            aria-label={t('climbing.done_drawing_line')}
          >
            <CheckIcon fontSize="small" />
          </GlassCircleButton>
        </Tooltip>
        <Tooltip title={t('climbing.clear_guide_points')} arrow>
          <span>
            <GlassCircleButton
              $tone="destructive"
              disabled={controlPoints.length === 0}
              onClick={clearGuide}
              aria-label={t('climbing.clear_guide_points')}
            >
              <DeleteOutlineIcon fontSize="small" />
            </GlassCircleButton>
          </span>
        </Tooltip>
        {!isHelpOpen && (
          <Tooltip title={t('climbing.show_help')} arrow>
            <GlassCircleButton
              $tone="muted"
              onClick={() => setHelpDismissed(false)}
              aria-label={t('climbing.show_help')}
            >
              <HelpOutlineIcon fontSize="small" />
            </GlassCircleButton>
          </Tooltip>
        )}
      </ButtonRow>
    </ToolbarContainer>
  );
};

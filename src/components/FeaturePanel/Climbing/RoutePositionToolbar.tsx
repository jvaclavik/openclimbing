import React, { useState } from 'react';
import maplibregl from 'maplibre-gl';
import styled from '@emotion/styled';
import {
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import { t } from '../../../services/intl';
import { useCragRoutePositionEditor } from './utils/useCragRoutePositionEditor';

const ToolbarContainer = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 150px;
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

const HelperPaper = styled(Paper)`
  padding: 8px 8px 8px 12px;
  max-width: 360px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  const [isHelpOpen, setIsHelpOpen] = useState(true);
  const { isGuideMode, setIsGuideMode, clearGuide, controlPoints, hasRoutes } =
    useCragRoutePositionEditor(mapRef, isMapLoaded, styleEpoch, {
      showNames,
      showGrades,
    });

  if (!hasRoutes) return null;

  if (!isGuideMode) {
    return (
      <ToolbarContainer>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<TimelineIcon />}
          onClick={() => setIsGuideMode(true)}
        >
          {t('climbing.distribute_along_line')}
        </Button>
      </ToolbarContainer>
    );
  }

  return (
    <ToolbarContainer>
      {isHelpOpen ? (
        <HelperPaper elevation={3}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Typography variant="body2">
              {t('climbing.route_positions_help')}
            </Typography>
            <Tooltip title={t('climbing.minimize_help')} arrow>
              <IconButton
                size="small"
                sx={{ mt: '-2px' }}
                onClick={() => setIsHelpOpen(false)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </HelperPaper>
      ) : (
        <Tooltip title={t('climbing.show_help')} arrow>
          <IconButton
            size="small"
            color="secondary"
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
      )}
      <ButtonRow>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setIsGuideMode(false)}
        >
          {t('climbing.done_drawing_line')}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          disabled={controlPoints.length === 0}
          onClick={clearGuide}
        >
          {t('climbing.clear_guide_points')}
        </Button>
      </ButtonRow>
    </ToolbarContainer>
  );
};

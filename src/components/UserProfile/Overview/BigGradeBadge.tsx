import React from 'react';
import { Box, useTheme } from '@mui/material';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import {
  findOrConvertRouteGrade,
  getDifficultyColor,
} from '../../../services/tagging/climbing/routeGrade';
import { RouteDifficulty } from '../../FeaturePanel/Climbing/types';

/** Large variant of RouteDifficultyBadge (same colors, same grade conversion). */
export const BigGradeBadge = ({
  routeDifficulties,
}: {
  routeDifficulties: RouteDifficulty[];
}) => {
  const theme = useTheme();
  const { userSettings } = useUserSettingsContext();
  const { routeDifficulty } = findOrConvertRouteGrade(
    routeDifficulties,
    userSettings['climbing.gradeSystem'],
  );
  const color = getDifficultyColor(routeDifficulty, theme.palette.mode);

  return (
    <Box
      sx={{
        minWidth: 72,
        height: 60,
        px: 1.5,
        borderRadius: '12px',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'monospace',
        fontWeight: 900,
        fontSize: 28,
        backgroundColor: color,
        color: theme.palette.getContrastText(color),
        flexShrink: 0,
      }}
    >
      {routeDifficulty?.grade ?? '?'}
    </Box>
  );
};

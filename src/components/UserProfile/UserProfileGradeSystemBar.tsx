import React from 'react';
import { Stack, Typography } from '@mui/material';
import { t } from '../../services/intl';
import { PanelSidePadding } from '../utils/PanelHelpers';
import { GradeSystemSelect } from '../FeaturePanel/Climbing/GradeSystemSelect';

export const UserProfileGradeSystemBar = () => (
  <PanelSidePadding>
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      sx={{ mb: 1 }}
    >
      <Typography variant="body2" color="text.secondary">
        {t('user_settings.default_grade_system')}
      </Typography>
      <GradeSystemSelect size="small" />
    </Stack>
  </PanelSidePadding>
);

import { extractClimbingGradeFromTagName } from '../../../../../../services/tagging/climbing/routeGrade';
import { GradeSelect } from '../GradeSelect';
import React from 'react';
import { useUserSettingsContext } from '../../../../../utils/userSettings/UserSettingsContext';
import { useCurrentItem } from '../../../context/EditContext';
import { GradeSystemSelect } from '../../../../Climbing/GradeSystemSelect';
import { Box, Stack, Typography } from '@mui/material';
import { t } from '../../../../../../services/intl';
import { isClimbingRoute } from '../../../../../../utils';

export const ClimbingGradesEditor = () => {
  const { tags } = useCurrentItem();
  const { gradeSystem } = useUserSettingsContext();

  const key = `climbing:grade:${gradeSystem}`;
  const climbingGradeSystem = extractClimbingGradeFromTagName(key);
  const isRoute = isClimbingRoute(tags);

  if (!isRoute) {
    return null;
  }

  return (
    <Box
      sx={{
        mb: 2,
      }}
    >
      <Typography
        sx={{
          mb: 1,
        }}
      >
        {t('tags.climbing_grade')}
      </Typography>
      <Stack
        direction="row"
        sx={{
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            flex: '1',
          }}
        >
          <GradeSelect
            k={key}
            climbingGradeSystem={climbingGradeSystem}
            tags={tags}
          />
        </Box>
        <GradeSystemSelect showDefaultOnButton />
      </Stack>
    </Box>
  );
};

import { Stack } from '@mui/material';
import { getDifficulties } from '../../services/tagging/climbing/routeGrade';
import { isFeatureClimbingRoute } from '../../utils';
import { useFeatureContext } from '../utils/FeatureContext';
import { ConvertedRouteDifficultyBadge } from './Climbing/ConvertedRouteDifficultyBadge';
import { GradeSystemSelect } from './Climbing/GradeSystemSelect';

export const ClimbingRouteGrade = () => {
  const { feature } = useFeatureContext();
  if (!isFeatureClimbingRoute(feature)) {
    return null;
  }

  const routeDifficulties = getDifficulties(feature?.tags);

  return (
    <Stack direction="row" spacing={1} alignItems="center" paddingBottom={2}>
      <ConvertedRouteDifficultyBadge routeDifficulties={routeDifficulties} />
      <GradeSystemSelect />
    </Stack>
  );
};

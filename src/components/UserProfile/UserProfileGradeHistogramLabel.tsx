import React from 'react';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { getDifficulties } from '../../services/tagging/climbing/routeGrade';
import { GradeSystem } from '../../services/tagging/climbing/gradeSystems';
import { ConvertedRouteDifficultyBadge } from '../FeaturePanel/Climbing/ConvertedRouteDifficultyBadge';
import { RouteDifficultyBadge } from '../FeaturePanel/Climbing/RouteDifficultyBadge';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';

export function UserProfileGradeHistogramLabel({
  sampleTick,
  gradeFallback,
}: {
  sampleTick: FetchedClimbingTick | null;
  gradeFallback: string;
}) {
  const { userSettings } = useUserSettingsContext();
  const system = userSettings['climbing.gradeSystem'] as GradeSystem;
  const diffs = sampleTick?.tags ? getDifficulties(sampleTick.tags) : undefined;
  if (diffs && diffs.length > 0) {
    return <ConvertedRouteDifficultyBadge routeDifficulties={diffs} />;
  }
  return (
    <RouteDifficultyBadge
      routeDifficulty={{ grade: gradeFallback, gradeSystem: system }}
    />
  );
}

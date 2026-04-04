import { useEffect, useState } from 'react';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { GradeSystem } from '../../services/tagging/climbing/gradeSystems';
import { ClimbingTick } from '../../types';
import { mapFeaturesDataToTicks } from './mapMyTicksRows';

type UseMyTicksPanelDataOptions = {
  /** When false, panel rows stay empty (e.g. public profile before ticks load). */
  enabled?: boolean;
};

export const useMyTicksPanelData = (
  ticks: ClimbingTick[] | null,
  gradeSystem: GradeSystem,
  options?: UseMyTicksPanelDataOptions,
) => {
  const enabled = options?.enabled !== false;
  const [fetchedTicks, setFetchedTicks] = useState<FetchedClimbingTick[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setFetchedTicks([]);
      setIsLoading(false);
      return;
    }

    if (ticks === null) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    if (ticks.length === 0) {
      setFetchedTicks([]);
      return;
    }

    setFetchedTicks(mapFeaturesDataToTicks(ticks, [], gradeSystem));
  }, [enabled, ticks, gradeSystem]);

  return { fetchedTicks, isLoading };
};

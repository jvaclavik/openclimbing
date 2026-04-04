import { useEffect, useState } from 'react';
import {
  FetchedClimbingTick,
  getMyTicksFeatures,
} from '../../services/my-ticks/getMyTicks';
import { OverpassFeature } from '../../services/overpass/overpassSearch';
import { ClimbingTick } from '../../types';
import { GradeSystem } from '../../services/tagging/climbing/gradeSystems';
import { mapFeaturesDataToTicks } from './mapMyTicksRows';

type UseMyTicksPanelDataOptions = {
  /** When false, Overpass fetch is skipped (e.g. public profile before ticks are loaded). */
  enabled?: boolean;
};

export const useMyTicksPanelData = (
  ticks: ClimbingTick[] | null,
  isFetching: boolean,
  gradeSystem: GradeSystem,
  options?: UseMyTicksPanelDataOptions,
) => {
  const enabled = options?.enabled !== false;
  const [fetchedTicks, setFetchedTicks] = useState<FetchedClimbingTick[]>([]);
  const [features, setFeatures] = useState<OverpassFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setFetchedTicks([]);
      setFeatures([]);
      setIsLoading(false);
      return;
    }

    const tickList = ticks ?? [];

    if (tickList.length === 0) {
      if (isFetching) {
        setIsLoading(true);
        return;
      }
      setFetchedTicks([]);
      setFeatures([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let cancelled = false;

    getMyTicksFeatures(tickList)
      .then((nextFeatures) => {
        if (cancelled) {
          return;
        }
        setFeatures(nextFeatures);
        setFetchedTicks(
          mapFeaturesDataToTicks(tickList, nextFeatures, gradeSystem),
        );
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticks, gradeSystem, isFetching, enabled]);

  return { fetchedTicks, features, isLoading };
};

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';
import {
  ClimbingListType,
  CLIMBING_LIST_PATHS,
  nextListTypeFromFilter,
} from '../../services/climbing-areas/climbingListTypes';

export const useClimbingListFilterSync = (listType: ClimbingListType) => {
  const router = useRouter();
  const { poiTypes, setPoiTypes } = useUserSettingsContext().climbingFilter;
  const poiTypesRef = useRef(poiTypes);
  poiTypesRef.current = poiTypes;
  const skipFilterNavigation = useRef(true);

  useEffect(() => {
    const current = poiTypesRef.current;
    if (!current[listType]) {
      setPoiTypes({ ...current, [listType]: true });
    }
  }, [listType]); // eslint-disable-line react-hooks/exhaustive-deps -- only when the page type changes

  useEffect(() => {
    if (skipFilterNavigation.current) {
      skipFilterNavigation.current = false;
      return;
    }
    const next = nextListTypeFromFilter(listType, poiTypes);
    if (!next) return;
    const path = CLIMBING_LIST_PATHS[next];
    if (router.pathname !== path) {
      router.replace(path);
    }
  }, [listType, poiTypes.rock, poiTypes.ferrata, poiTypes.gym]); // eslint-disable-line react-hooks/exhaustive-deps -- router.replace is stable enough here
};

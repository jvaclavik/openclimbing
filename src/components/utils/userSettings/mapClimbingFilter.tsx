import { GradeSystem } from '../../../services/tagging/climbing/gradeSystems';
import { isEqual } from 'lodash';
import { Interval, PoiTypes } from './getClimbingFilter';

export const mapClimbingFilter = {
  userSystem: undefined as GradeSystem | undefined,
  gradeInterval: undefined as Interval | undefined,
  minimumRoutes: undefined as number | undefined,
  poiTypes: undefined as PoiTypes | undefined,
  isDefaultFilter: false,
  isGradeIntervalDefault: true,
  isMinimumRoutesDefault: true,
  callback: () => {},
};

export const updateMapFilter = (
  userSystem: GradeSystem,
  gradeInterval: Interval,
  minimumRoutes: number,
  poiTypes: PoiTypes,
  isDefaultFilter: boolean,
) => {
  if (
    mapClimbingFilter.userSystem != userSystem ||
    !isEqual(mapClimbingFilter.gradeInterval, gradeInterval) ||
    mapClimbingFilter.minimumRoutes != minimumRoutes ||
    !isEqual(mapClimbingFilter.poiTypes, poiTypes)
  ) {
    mapClimbingFilter.userSystem = userSystem;
    mapClimbingFilter.gradeInterval = gradeInterval;
    mapClimbingFilter.minimumRoutes = minimumRoutes;
    mapClimbingFilter.poiTypes = poiTypes;
    mapClimbingFilter.isDefaultFilter = isDefaultFilter;
    mapClimbingFilter.callback();
  }
};

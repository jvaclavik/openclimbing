import { GradeSystem } from '../../../services/tagging/climbing/gradeSystems';
import isEqual from 'lodash/isEqual';
import { Interval, PoiTypes } from './getClimbingFilter';

export type MapClimbingFilterState = {
  userSystem: GradeSystem | undefined;
  gradeInterval: Interval | undefined;
  minimumRoutes: number | undefined;
  poiTypes: PoiTypes | undefined;
  climbingTypes: string[];
  inclinations: string[];
  materials: string[];
  familyFriendly: boolean;
  isDefaultFilter: boolean;
  isGradeIntervalDefault: boolean;
  isMinimumRoutesDefault: boolean;
};

export const mapClimbingFilter: MapClimbingFilterState & {
  callback: () => void;
} = {
  userSystem: undefined,
  gradeInterval: undefined,
  minimumRoutes: undefined,
  poiTypes: undefined,
  climbingTypes: [],
  inclinations: [],
  materials: [],
  familyFriendly: false,
  isDefaultFilter: false,
  isGradeIntervalDefault: true,
  isMinimumRoutesDefault: true,
  callback: () => {},
};

export const updateMapFilter = (next: MapClimbingFilterState) => {
  if (
    mapClimbingFilter.userSystem != next.userSystem ||
    !isEqual(mapClimbingFilter.gradeInterval, next.gradeInterval) ||
    mapClimbingFilter.minimumRoutes != next.minimumRoutes ||
    !isEqual(mapClimbingFilter.poiTypes, next.poiTypes) ||
    !isEqual(mapClimbingFilter.climbingTypes, next.climbingTypes) ||
    !isEqual(mapClimbingFilter.inclinations, next.inclinations) ||
    !isEqual(mapClimbingFilter.materials, next.materials) ||
    mapClimbingFilter.familyFriendly != next.familyFriendly
  ) {
    Object.assign(mapClimbingFilter, next);
    mapClimbingFilter.callback();
  }
};

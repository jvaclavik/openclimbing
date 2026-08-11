import { GradeSystem } from '../../../services/tagging/climbing/gradeSystems';
import isEqual from 'lodash/isEqual';
import { Interval, PhotoDrawnFilter, PoiTypes } from './getClimbingFilter';
import { DEFAULT_LENGTH_INTERVAL } from '../../../services/tagging/climbing/parseClimbingLength';

export type MapClimbingFilterState = {
  userSystem: GradeSystem | undefined;
  gradeInterval: Interval | undefined;
  minimumRoutes: number | undefined;
  poiTypes: PoiTypes | undefined;
  climbingTypes: string[];
  inclinations: string[];
  materials: string[];
  familyFriendly: boolean;
  photoDrawn: PhotoDrawnFilter;
  lengthInterval: Interval;
  isDefaultFilter: boolean;
  isGradeIntervalDefault: boolean;
  isMinimumRoutesDefault: boolean;
  isLengthIntervalDefault: boolean;
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
  photoDrawn: 'any',
  lengthInterval: DEFAULT_LENGTH_INTERVAL,
  isDefaultFilter: false,
  isGradeIntervalDefault: true,
  isMinimumRoutesDefault: true,
  isLengthIntervalDefault: true,
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
    mapClimbingFilter.familyFriendly != next.familyFriendly ||
    mapClimbingFilter.photoDrawn != next.photoDrawn ||
    !isEqual(mapClimbingFilter.lengthInterval, next.lengthInterval)
  ) {
    Object.assign(mapClimbingFilter, next);
    mapClimbingFilter.callback();
  }
};

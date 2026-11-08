import {
  ALL_FERRATA_GRADES,
  FerrataGrade,
} from '../../../services/tagging/ferrataGradeFilter';
import { GradeSystem } from '../../../services/tagging/climbing/gradeSystems';
import isEqual from 'lodash/isEqual';
import { Interval, PhotoDrawnFilter, PoiTypes } from './getClimbingFilter';
import { DEFAULT_LENGTH_INTERVAL } from '../../../services/tagging/climbing/parseClimbingLength';
import {
  DEFAULT_FERRATA_ELE_INTERVAL,
  DEFAULT_FERRATA_LENGTH_INTERVAL,
  DEFAULT_FERRATA_SPAN_INTERVAL,
} from '../../../services/tagging/ferrataMeasures';

export type MapClimbingFilterState = {
  ferrataGrades: FerrataGrade[];
  ferrataCountries: string[];
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
  ferrataLengthInterval: Interval;
  ferrataSpanInterval: Interval;
  ferrataEleInterval: Interval;
  isDefaultFilter: boolean;
  isGradeIntervalDefault: boolean;
  isMinimumRoutesDefault: boolean;
  isLengthIntervalDefault: boolean;
  isFerrataLengthDefault: boolean;
  isFerrataSpanDefault: boolean;
  isFerrataEleDefault: boolean;
};

export const mapClimbingFilter: MapClimbingFilterState & {
  callback: () => void;
} = {
  ferrataGrades: ALL_FERRATA_GRADES,
  ferrataCountries: [],
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
  ferrataLengthInterval: DEFAULT_FERRATA_LENGTH_INTERVAL,
  ferrataSpanInterval: DEFAULT_FERRATA_SPAN_INTERVAL,
  ferrataEleInterval: DEFAULT_FERRATA_ELE_INTERVAL,
  isDefaultFilter: false,
  isGradeIntervalDefault: true,
  isMinimumRoutesDefault: true,
  isLengthIntervalDefault: true,
  isFerrataLengthDefault: true,
  isFerrataSpanDefault: true,
  isFerrataEleDefault: true,
  callback: () => {},
};

export const updateMapFilter = (next: MapClimbingFilterState) => {
  if (
    !isEqual(mapClimbingFilter.ferrataGrades, next.ferrataGrades) ||
    !isEqual(mapClimbingFilter.ferrataCountries, next.ferrataCountries) ||
    mapClimbingFilter.userSystem != next.userSystem ||
    !isEqual(mapClimbingFilter.gradeInterval, next.gradeInterval) ||
    mapClimbingFilter.minimumRoutes != next.minimumRoutes ||
    !isEqual(mapClimbingFilter.poiTypes, next.poiTypes) ||
    !isEqual(mapClimbingFilter.climbingTypes, next.climbingTypes) ||
    !isEqual(mapClimbingFilter.inclinations, next.inclinations) ||
    !isEqual(mapClimbingFilter.materials, next.materials) ||
    mapClimbingFilter.familyFriendly != next.familyFriendly ||
    mapClimbingFilter.photoDrawn != next.photoDrawn ||
    !isEqual(mapClimbingFilter.lengthInterval, next.lengthInterval) ||
    !isEqual(
      mapClimbingFilter.ferrataLengthInterval,
      next.ferrataLengthInterval,
    ) ||
    !isEqual(mapClimbingFilter.ferrataSpanInterval, next.ferrataSpanInterval) ||
    !isEqual(mapClimbingFilter.ferrataEleInterval, next.ferrataEleInterval)
  ) {
    Object.assign(mapClimbingFilter, next);
    mapClimbingFilter.callback();
  }
};

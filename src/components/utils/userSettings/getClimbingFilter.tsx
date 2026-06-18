import {
  UserSettingsContextType,
  UserSettingsType,
} from './UserSettingsContext';
import { GRADE_TABLE } from '../../../services/tagging/climbing/gradeData';
import {
  DEFAULT_GRADE_SYSTEM,
  GradeSystem,
} from '../../../services/tagging/climbing/gradeSystems';
import { Setter } from '../../../types';
import { updateMapFilter } from './mapClimbingFilter';

export type Interval = [number, number];

export type PoiTypes = {
  rock: boolean;
  ferrata: boolean;
  gym: boolean;
};

export type ClimbingFilterSettings = {
  filterGradeSystem: GradeSystem;
  gradeInterval: Interval | null;
  minimumRoutes: number;
  poiTypes: Partial<PoiTypes>;
  climbingTypes: string[];
  inclinations: string[];
  materials: string[];
  familyFriendly: boolean;
};

type SetFilter = <T extends keyof ClimbingFilterSettings>(
  name: T,
  value: ClimbingFilterSettings[T],
) => void;

const SETTINGS_KEY = 'climbing.filter';
const DEFAULT_MINIMUM_ROUTES = 1;
const DEFAULT_POI_TYPES: PoiTypes = { rock: true, ferrata: true, gym: false };

const isSameInterval = (a: Interval, b: Interval) =>
  a[0] === b[0] && a[1] === b[1];

const isSamePoiTypes = (a: PoiTypes, b: PoiTypes) =>
  a.rock === b.rock && a.ferrata === b.ferrata && a.gym === b.gym;

export type ClimbingFilter = {
  grades: string[];
  gradeInterval: Interval;
  setGradeInterval: Setter<Interval>;
  minimumRoutes: number;
  setMinimumRoutes: Setter<number>;
  poiTypes: PoiTypes;
  setPoiTypes: Setter<PoiTypes>;
  climbingTypes: string[];
  setClimbingTypes: Setter<string[]>;
  inclinations: string[];
  setInclinations: Setter<string[]>;
  materials: string[];
  setMaterials: Setter<string[]>;
  familyFriendly: boolean;
  setFamilyFriendly: Setter<boolean>;
  isDefaultFilter: boolean;
  isGradeIntervalDefault: boolean;
  isMinimumRoutesDefault: boolean;
  isPoiTypesDefault: boolean;
  isClimbingTypesDefault: boolean;
  isInclinationsDefault: boolean;
  isMaterialsDefault: boolean;
  isFamilyFriendlyDefault: boolean;
  numberOfActiveFilters: number;
  reset: () => void;
};

export const getClimbingFilter = (
  userSettings: UserSettingsType,
  setUserSetting: UserSettingsContextType['setUserSetting'],
): ClimbingFilter => {
  const userSystem = userSettings['climbing.gradeSystem'];

  const grades = GRADE_TABLE[userSystem || DEFAULT_GRADE_SYSTEM];
  const data = (userSettings[SETTINGS_KEY] ?? {}) as ClimbingFilterSettings;

  const setFilter: SetFilter = (name, value) => {
    setUserSetting(SETTINGS_KEY, { ...data, [name]: value });
  };

  const defaultGradeInterval = [0, grades.length - 1] as Interval;
  const gradeInterval = data?.gradeInterval ?? defaultGradeInterval;
  const setGradeInterval = (interval: Interval) =>
    setFilter('gradeInterval', interval);

  const minimumRoutes = data?.minimumRoutes ?? DEFAULT_MINIMUM_ROUTES;
  const setMinimumRoutes = (num: number) => setFilter('minimumRoutes', num);

  const poiTypes: PoiTypes = {
    ...DEFAULT_POI_TYPES,
    ...(data?.poiTypes ?? {}),
  };
  const setPoiTypes = (next: PoiTypes) => setFilter('poiTypes', next);

  const climbingTypes = data?.climbingTypes ?? [];
  const setClimbingTypes = (next: string[]) => setFilter('climbingTypes', next);

  const inclinations = data?.inclinations ?? [];
  const setInclinations = (next: string[]) => setFilter('inclinations', next);

  const materials = data?.materials ?? [];
  const setMaterials = (next: string[]) => setFilter('materials', next);

  const familyFriendly = data?.familyFriendly ?? false;
  const setFamilyFriendly = (next: boolean) =>
    setFilter('familyFriendly', next);

  const isGradeIntervalDefault = isSameInterval(
    gradeInterval,
    defaultGradeInterval,
  );
  const isMinimumRoutesDefault = minimumRoutes === DEFAULT_MINIMUM_ROUTES;
  const isPoiTypesDefault = isSamePoiTypes(poiTypes, DEFAULT_POI_TYPES);
  const isClimbingTypesDefault = climbingTypes.length === 0;
  const isInclinationsDefault = inclinations.length === 0;
  const isMaterialsDefault = materials.length === 0;
  const isFamilyFriendlyDefault = !familyFriendly;

  const isDefaultFilter =
    isGradeIntervalDefault &&
    isMinimumRoutesDefault &&
    isPoiTypesDefault &&
    isClimbingTypesDefault &&
    isInclinationsDefault &&
    isMaterialsDefault &&
    isFamilyFriendlyDefault;

  const numberOfActiveFilters = [
    isGradeIntervalDefault,
    isMinimumRoutesDefault,
    isPoiTypesDefault,
    isClimbingTypesDefault,
    isInclinationsDefault,
    isMaterialsDefault,
    isFamilyFriendlyDefault,
  ].filter((isDefault) => !isDefault).length;

  updateMapFilter({
    userSystem,
    gradeInterval,
    minimumRoutes,
    poiTypes,
    climbingTypes,
    inclinations,
    materials,
    familyFriendly,
    isDefaultFilter,
    isGradeIntervalDefault,
    isMinimumRoutesDefault,
  });

  return {
    grades,
    gradeInterval,
    setGradeInterval,
    minimumRoutes,
    setMinimumRoutes,
    poiTypes,
    setPoiTypes,
    climbingTypes,
    setClimbingTypes,
    inclinations,
    setInclinations,
    materials,
    setMaterials,
    familyFriendly,
    setFamilyFriendly,
    isDefaultFilter,
    isGradeIntervalDefault,
    isMinimumRoutesDefault,
    isPoiTypesDefault,
    isClimbingTypesDefault,
    isInclinationsDefault,
    isMaterialsDefault,
    isFamilyFriendlyDefault,
    numberOfActiveFilters,
    reset: () => setUserSetting(SETTINGS_KEY, {} as ClimbingFilterSettings),
  };
};

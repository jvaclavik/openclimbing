import { FeatureTags } from '../../types';
import { parseClimbingLengthMeters } from './parseClimbingLength';

// Tag suffixes of `climbing:<key>` used as climbing-type filter values
export const CLIMBING_TYPE_KEYS = [
  'sport',
  'trad',
  'boulder',
  'multipitch',
  'toprope',
  'speed',
  'ice',
  'mixed',
  'deepwater',
] as const;

// Tag suffixes of `climbing:inclination:<key>`
export const INCLINATION_KEYS = [
  'slab',
  'vertical',
  'overhang',
  'roof',
  'traverse',
] as const;

// Values of the single-value `climbing:start` tag (how the climb/boulder starts)
export const CLIMBING_START_OPTIONS = [
  { value: 'sit', translationKey: 'climbing_start.sit' },
  { value: 'stand', translationKey: 'climbing_start.stand' },
  { value: 'low', translationKey: 'climbing_start.low' },
  { value: 'crouch', translationKey: 'climbing_start.crouch' },
  { value: 'jump', translationKey: 'climbing_start.jump' },
] as const;

export type ClimbingAttributes = {
  materials: string[];
  climbingTypes: string[];
  inclinations: string[];
  familyFriendly: boolean;
  lengthMin?: number;
  lengthMax?: number;
};

export const isClimbingTagSet = (value?: string) =>
  value !== undefined && value !== 'no' && value !== '0';

const lengthFromFeatureTags = (tags: FeatureTags) => {
  const values = [
    parseClimbingLengthMeters(tags['climbing:length']),
    parseClimbingLengthMeters(tags['climbing:length:min']),
    parseClimbingLengthMeters(tags['climbing:length:max']),
  ].filter(Boolean);
  if (values.length === 0) return undefined;
  return {
    lengthMin: Math.min(...values.map((v) => v!.min)),
    lengthMax: Math.max(...values.map((v) => v!.max)),
  };
};

export const getClimbingAttributes = (
  tags: FeatureTags = {},
): ClimbingAttributes => {
  const length = lengthFromFeatureTags(tags);
  return {
    materials: tags['climbing:rock'] ? [tags['climbing:rock']] : [],
    climbingTypes: CLIMBING_TYPE_KEYS.filter((key) =>
      isClimbingTagSet(tags[`climbing:${key}`]),
    ),
    inclinations: INCLINATION_KEYS.filter((key) =>
      isClimbingTagSet(tags[`climbing:inclination:${key}`]),
    ),
    familyFriendly: isClimbingTagSet(tags['climbing:family_friendly']),
    lengthMin: length?.lengthMin,
    lengthMax: length?.lengthMax,
  };
};

const uniq = (values: string[]) => Array.from(new Set(values));

export const mergeClimbingAttributes = (
  attributesList: ClimbingAttributes[],
): ClimbingAttributes => {
  const lengthMins = attributesList
    .map((a) => a.lengthMin)
    .filter((v): v is number => v !== undefined);
  const lengthMaxs = attributesList
    .map((a) => a.lengthMax)
    .filter((v): v is number => v !== undefined);

  return {
    materials: uniq(attributesList.flatMap((a) => a.materials)),
    climbingTypes: uniq(attributesList.flatMap((a) => a.climbingTypes)),
    inclinations: uniq(attributesList.flatMap((a) => a.inclinations)),
    familyFriendly: attributesList.some((a) => a.familyFriendly),
    lengthMin: lengthMins.length ? Math.min(...lengthMins) : undefined,
    lengthMax: lengthMaxs.length ? Math.max(...lengthMaxs) : undefined,
  };
};

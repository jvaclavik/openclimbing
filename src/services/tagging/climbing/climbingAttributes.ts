import { FeatureTags } from '../../types';

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

export type ClimbingAttributes = {
  materials: string[];
  climbingTypes: string[];
  inclinations: string[];
  familyFriendly: boolean;
};

export const isClimbingTagSet = (value?: string) =>
  value !== undefined && value !== 'no' && value !== '0';

export const getClimbingAttributes = (
  tags: FeatureTags = {},
): ClimbingAttributes => ({
  materials: tags['climbing:rock'] ? [tags['climbing:rock']] : [],
  climbingTypes: CLIMBING_TYPE_KEYS.filter((key) =>
    isClimbingTagSet(tags[`climbing:${key}`]),
  ),
  inclinations: INCLINATION_KEYS.filter((key) =>
    isClimbingTagSet(tags[`climbing:inclination:${key}`]),
  ),
  familyFriendly: isClimbingTagSet(tags['climbing:family_friendly']),
});

const uniq = (values: string[]) => Array.from(new Set(values));

export const mergeClimbingAttributes = (
  attributesList: ClimbingAttributes[],
): ClimbingAttributes => ({
  materials: uniq(attributesList.flatMap((a) => a.materials)),
  climbingTypes: uniq(attributesList.flatMap((a) => a.climbingTypes)),
  inclinations: uniq(attributesList.flatMap((a) => a.inclinations)),
  familyFriendly: attributesList.some((a) => a.familyFriendly),
});

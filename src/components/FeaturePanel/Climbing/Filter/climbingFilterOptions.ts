import { TranslationId } from '../../../../services/types';

export type ClimbingFilterOption = {
  value: string;
  label: TranslationId;
};

// `value` is the suffix of the OSM tag `climbing:<value>`
export const CLIMBING_TYPE_FILTER_OPTIONS: ClimbingFilterOption[] = [
  { value: 'sport', label: 'climbing_badges.sport_label' },
  { value: 'trad', label: 'climbing_badges.trad_label' },
  { value: 'boulder', label: 'climbing_badges.boulder_label' },
  { value: 'multipitch', label: 'climbing_badges.multipitch_label' },
  { value: 'toprope', label: 'climbing_badges.toprope_label' },
  { value: 'speed', label: 'climbing_badges.speed_label' },
  { value: 'ice', label: 'climbing_badges.ice_label' },
  { value: 'mixed', label: 'climbing_badges.mixed_label' },
  { value: 'deepwater', label: 'climbing_badges.deepwater_label' },
];

// `value` is the suffix of the OSM tag `climbing:inclination:<value>`
export const INCLINATION_FILTER_OPTIONS: ClimbingFilterOption[] = [
  { value: 'slab', label: 'climbing_badges.inclination_slab_label' },
  { value: 'vertical', label: 'climbing_badges.inclination_vertical_label' },
  { value: 'overhang', label: 'climbing_badges.inclination_overhang_label' },
  { value: 'roof', label: 'climbing_badges.inclination_roof_label' },
  { value: 'traverse', label: 'climbing_badges.inclination_traverse_label' },
];

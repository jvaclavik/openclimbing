import { FeatureTags, TranslationId } from '../../types';
import { getClimbingAttributes } from './climbingAttributes';

// The order of this array must be the same as CSV in gradeData.ts
export const GRADE_SYSTEMS = [
  {
    key: 'uiaa', // TODO this should be `as const` otherwise it is just string
    category: 'roped',
    name: 'UIAA',
    flags: '🇪🇺',
    minor: false,
    description:
      'Grade system used by the International Climbing and Mountaineering Federation. Widely used in Alps and central Europe.',
  },
  {
    key: 'french',
    category: 'roped',
    name: 'French',
    flags: '🇪🇺',
    minor: false,
    description:
      'The French numerical system (Fontainebleau scale) rates a climb according to the overall technical difficulty and strenuousness of the route. Widely used, mainly in western Europe.',
  },
  {
    key: 'saxon',
    category: 'roped',
    name: 'Saxon',
    flags: '🇩🇪🇨🇿',
    minor: false,
    description:
      'The Saxon grading system was developed in the beginning of the 20th century for the formidable Saxon Switzerland (Germany, Czechia) climbing region with strict ethics.',
  },
  {
    key: 'yds_class',
    category: 'roped',
    name: 'YDS',
    flags: '🇺🇸',
    minor: false,
    description:
      'The Yosemite Decimal System of grading routes of hikes and climbs developed for the Sierra Nevada range (USA).',
  },
  {
    key: 'hueco',
    category: 'boulder',
    name: 'V scale',
    flags: '🇺🇸',
    minor: false,
    description:
      'V scale grading system, created by John Sherman, which is the most widely used system in North America.',
  },
  {
    key: 'british_traditional',
    category: 'roped',
    name: 'British technical',
    flags: '🇬🇧',
    minor: true,
    description: 'The British grading system for traditional climbs.',
  },
  {
    key: 'british_adjectival',
    category: 'roped',
    name: 'British Adjectival',
    flags: '🇬🇧',
    minor: true,
    description:
      'The Adjectival British Scale or the overall assessment scale.',
  },
  {
    key: 'french_british',
    category: 'roped',
    name: 'French British',
    flags: '🇬🇧🇮🇪',
    minor: true,
    description:
      'Sport climbing in Britain and Ireland uses the French grading system.',
  },
  {
    key: 'norwegian',
    category: 'roped',
    name: 'Norwegian',
    flags: '🇳🇴🇸🇪',
    minor: true,
    description: 'Norwegian grading system.',
  },
  {
    key: 'ice',
    category: 'ice',
    name: 'WI',
    flags: '🇨🇦',
    minor: true,
    description: 'Waterfall ice rating system as used in the Canadian Rockies.',
  },
  {
    key: 'mixed',
    category: 'mixed',
    name: 'Mixed',
    minor: true,
    description:
      'Mixed climbing has its own grading scale that roughly follows the WI rating system.',
  },
  {
    key: 'polish',
    category: 'roped',
    name: 'Polish',
    flags: '🇵🇱',
    minor: true,
    description: 'Polish grading system.',
  },
  {
    key: 'fb',
    category: 'boulder',
    name: 'Fontainebleau',
    flags: '🇪🇺',
    minor: true,
    description: 'Fontainebleau grading system for bouldering.',
  },
];

export type GradeSystem = (typeof GRADE_SYSTEMS)[number]['key'];

export const getGradeSystemName = (gradeSystemKey: GradeSystem) =>
  GRADE_SYSTEMS.find((item) => item.key === gradeSystemKey)?.name;

export const DEFAULT_GRADE_SYSTEM = 'uiaa';

export type GradeSystemCategory = 'boulder' | 'roped' | 'ice' | 'mixed';

// Grouping follows the climbing style -> grading system table of id-tagging-schema
export const GRADE_SYSTEM_CATEGORIES: {
  key: GradeSystemCategory;
  label: TranslationId;
  climbingTypes: string[];
}[] = [
  {
    key: 'roped',
    label: 'grade_system_select.category_roped',
    climbingTypes: ['sport', 'trad', 'deepwater'],
  },
  {
    key: 'boulder',
    label: 'climbing_badges.boulder_label',
    climbingTypes: ['boulder'],
  },
  { key: 'ice', label: 'climbing_badges.ice_label', climbingTypes: ['ice'] },
  {
    key: 'mixed',
    label: 'climbing_badges.mixed_label',
    climbingTypes: ['mixed'],
  },
];

// Only the feature's own tags - a climbing=crag does not inherit boulder-ness of its routes
export const getGradeSystemCategoriesForTags = (tags: FeatureTags = {}) => {
  const { climbingTypes } = getClimbingAttributes(tags);
  const matches = (category: (typeof GRADE_SYSTEM_CATEGORIES)[number]) =>
    category.climbingTypes.some(
      (type) => type === tags.climbing || climbingTypes.includes(type),
    );

  return [
    ...GRADE_SYSTEM_CATEGORIES.filter(matches),
    ...GRADE_SYSTEM_CATEGORIES.filter((category) => !matches(category)),
  ];
};

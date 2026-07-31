import { FeatureTags } from '../../../services/types';
import { tintHex } from '../../utils/colorUtils';

/**
 * Tag selectors of one category. Keys inside one selector are ANDed, the
 * selectors themselves are ORed. An array value matches any of the values.
 */
export type PoiTagSelector = Record<string, string | string[]>;

export type PoiCategory = {
  key: string;
  groupKey: string;
  selectors: PoiTagSelector[];
  icon: string; // sprite icon name without the `_11` suffix
  /** Dense categories are only loaded when zoomed in further. */
  minZoom?: number;
  /** Shown in the "most used" shortcut section of the search dropdown. */
  quick?: boolean;
};

export type PoiCategoryGroup = {
  key: string;
  color: string;
  icon: string;
  categories: PoiCategory[];
};

/** Below this zoom nothing is fetched at all – the bbox would be too large. */
export const POI_MIN_ZOOM = 13;

type GroupDefinition = {
  key: string;
  color: string;
  icon: string;
  categories: Omit<PoiCategory, 'groupKey'>[];
};

const groupDefinitions: GroupDefinition[] = [
  {
    key: 'access',
    color: '#1976d2',
    icon: 'parking',
    categories: [
      {
        key: 'parking',
        selectors: [{ amenity: 'parking' }],
        icon: 'parking',
        quick: true,
      },
      {
        key: 'bus_stop',
        selectors: [{ highway: 'bus_stop' }, { amenity: 'bus_station' }],
        icon: 'bus',
        minZoom: 14,
      },
      {
        key: 'train_station',
        selectors: [{ railway: ['station', 'halt', 'tram_stop'] }],
        icon: 'railway',
      },
      {
        key: 'aerialway_station',
        selectors: [{ aerialway: 'station' }],
        icon: 'aerialway',
      },
      { key: 'fuel', selectors: [{ amenity: 'fuel' }], icon: 'fuel' },
      {
        key: 'charging_station',
        selectors: [{ amenity: 'charging_station' }],
        icon: 'charging_station',
      },
      {
        key: 'bicycle_parking',
        selectors: [{ amenity: 'bicycle_parking' }],
        icon: 'bicycle_parked',
        minZoom: 15,
      },
    ],
  },
  {
    key: 'water',
    color: '#0288d1',
    icon: 'drinking_water',
    categories: [
      {
        key: 'drinking_water',
        selectors: [{ amenity: 'drinking_water' }],
        icon: 'drinking_water',
        quick: true,
      },
      { key: 'spring', selectors: [{ natural: 'spring' }], icon: 'water' },
      {
        key: 'water_tap',
        selectors: [{ man_made: 'water_tap' }],
        icon: 'water_tap',
      },
      {
        key: 'water_well',
        selectors: [{ man_made: 'water_well' }],
        icon: 'well_pump_manual',
      },
    ],
  },
  {
    key: 'food',
    color: '#ed6c02',
    icon: 'restaurant',
    categories: [
      {
        key: 'restaurant',
        selectors: [{ amenity: 'restaurant' }],
        icon: 'restaurant',
        minZoom: 14,
        quick: true,
      },
      {
        key: 'pub',
        selectors: [{ amenity: ['pub', 'bar', 'biergarten'] }],
        icon: 'beer',
        minZoom: 14,
      },
      {
        key: 'cafe',
        selectors: [{ amenity: 'cafe' }],
        icon: 'cafe',
        minZoom: 14,
      },
      {
        key: 'fast_food',
        selectors: [{ amenity: 'fast_food' }],
        icon: 'fast_food',
        minZoom: 14,
      },
      {
        key: 'grocery',
        selectors: [
          { shop: ['supermarket', 'convenience', 'greengrocer', 'general'] },
        ],
        icon: 'grocery',
        minZoom: 14,
        quick: true,
      },
      {
        key: 'bakery',
        selectors: [{ shop: 'bakery' }],
        icon: 'bakery',
        minZoom: 14,
      },
      {
        key: 'ice_cream',
        selectors: [{ amenity: 'ice_cream' }, { shop: 'ice_cream' }],
        icon: 'ice_cream',
        minZoom: 15,
      },
    ],
  },
  {
    key: 'sleep',
    color: '#7b1fa2',
    icon: 'campsite',
    categories: [
      {
        key: 'camp_site',
        selectors: [{ tourism: 'camp_site' }],
        icon: 'campsite',
        quick: true,
      },
      {
        key: 'caravan_site',
        selectors: [{ tourism: 'caravan_site' }],
        icon: 'camper_trailer',
      },
      {
        key: 'hut',
        selectors: [{ tourism: ['alpine_hut', 'wilderness_hut'] }],
        icon: 'hut',
      },
      {
        key: 'shelter',
        selectors: [{ amenity: 'shelter' }],
        icon: 'shelter',
        quick: true,
      },
      {
        key: 'lodging',
        selectors: [
          { tourism: ['hotel', 'hostel', 'guest_house', 'motel', 'chalet'] },
        ],
        icon: 'lodging',
        minZoom: 14,
      },
    ],
  },
  {
    key: 'hygiene',
    color: '#00897b',
    icon: 'toilet',
    categories: [
      {
        key: 'toilets',
        selectors: [{ amenity: 'toilets' }],
        icon: 'toilet',
        quick: true,
      },
      { key: 'shower', selectors: [{ amenity: 'shower' }], icon: 'shower' },
      {
        key: 'waste_basket',
        selectors: [{ amenity: ['waste_basket', 'waste_disposal'] }],
        icon: 'waste_basket',
        minZoom: 16,
      },
      {
        key: 'laundry',
        selectors: [{ shop: 'laundry' }, { amenity: 'laundry' }],
        icon: 'laundry',
        minZoom: 14,
      },
    ],
  },
  {
    key: 'outdoor',
    color: '#2e7d32',
    icon: 'viewpoint',
    categories: [
      {
        key: 'viewpoint',
        selectors: [{ tourism: 'viewpoint' }],
        icon: 'viewpoint',
      },
      { key: 'peak', selectors: [{ natural: 'peak' }], icon: 'mountain' },
      {
        key: 'guidepost',
        selectors: [{ information: 'guidepost' }],
        icon: 'information',
        minZoom: 14,
      },
      {
        key: 'info_board',
        selectors: [{ information: ['board', 'map'] }],
        icon: 'info_board',
        minZoom: 14,
      },
      {
        key: 'picnic_site',
        selectors: [{ tourism: 'picnic_site' }],
        icon: 'picnic_site',
      },
      {
        key: 'firepit',
        selectors: [{ leisure: 'firepit' }, { amenity: 'bbq' }],
        icon: 'campfire',
        minZoom: 14,
      },
      {
        key: 'bench',
        selectors: [{ amenity: 'bench' }],
        icon: 'bench',
        minZoom: 16,
      },
      {
        key: 'cave_entrance',
        selectors: [{ natural: 'cave_entrance' }],
        icon: 'entrance',
      },
      {
        key: 'waterfall',
        selectors: [{ waterway: 'waterfall' }],
        icon: 'waterfall',
      },
      {
        key: 'swimming',
        selectors: [
          { leisure: ['swimming_area', 'swimming_pool'] },
          { natural: 'beach' },
        ],
        icon: 'swimming',
      },
    ],
  },
  {
    key: 'services',
    color: '#5d4037',
    icon: 'shop',
    categories: [
      {
        key: 'atm',
        selectors: [{ amenity: ['atm', 'bank'] }],
        icon: 'atm',
        minZoom: 14,
      },
      {
        key: 'pharmacy',
        selectors: [{ amenity: 'pharmacy' }],
        icon: 'pharmacy',
        minZoom: 14,
      },
      {
        key: 'doctor',
        selectors: [{ amenity: ['doctors', 'clinic'] }],
        icon: 'doctor',
        minZoom: 14,
      },
      {
        key: 'outdoor_shop',
        selectors: [{ shop: ['sports', 'outdoor'] }],
        icon: 'shop',
        minZoom: 14,
      },
      {
        key: 'bicycle_repair',
        selectors: [
          { amenity: 'bicycle_repair_station' },
          { shop: 'bicycle' },
          { 'service:bicycle:repair': 'yes' },
        ],
        icon: 'bicycle_repair',
        minZoom: 14,
      },
      {
        key: 'post',
        selectors: [{ amenity: 'post_office' }],
        icon: 'post',
        minZoom: 14,
      },
    ],
  },
  {
    key: 'emergency',
    color: '#d32f2f',
    icon: 'mountain_cross',
    categories: [
      {
        key: 'mountain_rescue',
        selectors: [
          { amenity: 'mountain_rescue' },
          { emergency: 'mountain_rescue' },
        ],
        icon: 'mountain_cross',
      },
      {
        key: 'hospital',
        selectors: [{ amenity: 'hospital' }],
        icon: 'hospital',
      },
      {
        key: 'defibrillator',
        selectors: [{ emergency: 'defibrillator' }],
        icon: 'defibrillator',
        minZoom: 14,
      },
      {
        key: 'emergency_phone',
        selectors: [{ emergency: 'phone' }],
        icon: 'emergency_phone',
      },
      { key: 'police', selectors: [{ amenity: 'police' }], icon: 'police' },
      {
        key: 'fire_station',
        selectors: [{ amenity: 'fire_station' }],
        icon: 'fire_station',
      },
    ],
  },
];

export const poiCategoryGroups: PoiCategoryGroup[] = groupDefinitions.map(
  ({ key, color, icon, categories }) => ({
    key,
    color,
    icon,
    categories: categories.map((category) => ({ ...category, groupKey: key })),
  }),
);

export const allPoiCategories: PoiCategory[] = poiCategoryGroups.flatMap(
  ({ categories }) => categories,
);

const byKey = new Map(
  allPoiCategories.map((category) => [category.key, category]),
);

export const getPoiCategory = (key: string) => byKey.get(key);

export const getPoiCategories = (keys: string[]) =>
  keys.map(getPoiCategory).filter(Boolean);

export const quickPoiCategories = allPoiCategories.filter(({ quick }) => quick);

export const getPoiCategoryColor = (category: PoiCategory) =>
  poiCategoryGroups.find(({ key }) => key === category.groupKey)?.color ??
  '#616161';

/** Pale variant used as the marker fill, so the dark sprite icon stays legible. */
export const getPoiCategoryFill = (category: PoiCategory) =>
  tintHex(getPoiCategoryColor(category), 0.86);

export const getPoiCategoryMinZoom = ({ minZoom }: PoiCategory) =>
  minZoom ?? POI_MIN_ZOOM;

const escapeRegexValue = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const selectorToQuery = (selector: PoiTagSelector) =>
  Object.entries(selector)
    .map(([key, value]) =>
      Array.isArray(value)
        ? `["${key}"~"^(${value.map(escapeRegexValue).join('|')})$"]`
        : `["${key}"="${value}"]`,
    )
    .join('');

/** Overpass statements (without the trailing semicolon) for given categories. */
export const getPoiCategoriesQueryParts = (categories: PoiCategory[]) => {
  const parts = categories.flatMap(({ selectors }) =>
    selectors.map((selector) => `nwr${selectorToQuery(selector)}`),
  );
  return [...new Set(parts)];
};

const matchesSelector = (tags: FeatureTags, selector: PoiTagSelector) =>
  Object.entries(selector).every(([key, value]) =>
    Array.isArray(value) ? value.includes(tags[key]) : tags[key] === value,
  );

export const matchesPoiCategory = (
  tags: FeatureTags,
  { selectors }: PoiCategory,
) => selectors.some((selector) => matchesSelector(tags, selector));

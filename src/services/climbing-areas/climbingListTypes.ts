export type ClimbingListType = 'rock' | 'ferrata' | 'gym';

export const CLIMBING_LIST_TYPES: ClimbingListType[] = [
  'rock',
  'ferrata',
  'gym',
];

export const CLIMBING_LIST_PATHS: Record<ClimbingListType, string> = {
  rock: '/climbing-areas',
  ferrata: '/via-ferratas',
  gym: '/climbing-gyms',
};

export const exclusivePoiTypes = (type: ClimbingListType) => ({
  rock: type === 'rock',
  ferrata: type === 'ferrata',
  gym: type === 'gym',
});

export const isClimbingListType = (value: unknown): value is ClimbingListType =>
  value === 'rock' || value === 'ferrata' || value === 'gym';

// When the map type filter no longer includes the current list, jump to the
// first still-enabled type so the page stays in sync with the filter.
export const nextListTypeFromFilter = (
  listType: ClimbingListType,
  poiTypes: Record<ClimbingListType, boolean>,
): ClimbingListType | null => {
  if (poiTypes[listType]) return null;
  return CLIMBING_LIST_TYPES.find((key) => poiTypes[key]) ?? null;
};

export const listTypeFromPoiTypes = (
  poiTypes: Record<ClimbingListType, boolean>,
): ClimbingListType =>
  CLIMBING_LIST_TYPES.find((key) => poiTypes[key]) ?? 'rock';

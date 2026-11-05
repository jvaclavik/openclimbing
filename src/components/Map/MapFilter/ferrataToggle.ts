import { PoiTypes } from '../../utils/userSettings/getClimbingFilter';

export const DEFAULT_POI_TYPES: PoiTypes = {
  rock: true,
  ferrata: true,
  gym: false,
};

export const isFerrataOnly = (poiTypes: PoiTypes) =>
  poiTypes.ferrata && !poiTypes.rock && !poiTypes.gym;

/**
 * Quick toggle: show only via ferratas, or restore the types from before.
 * Other filter settings (grade, length, …) stay as they are. Rock climbing
 * comes back with the snapshot, so a normal crag map is one click away.
 */
export const toggleFerrataOnly = (
  poiTypes: PoiTypes,
  restore: PoiTypes | null,
): { poiTypes: PoiTypes; restore: PoiTypes | null } => {
  if (isFerrataOnly(poiTypes)) {
    return { poiTypes: restore ?? DEFAULT_POI_TYPES, restore: null };
  }
  return {
    poiTypes: { rock: false, ferrata: true, gym: false },
    restore: poiTypes,
  };
};

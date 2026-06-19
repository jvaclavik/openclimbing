import { Feature, LonLat } from '../../../../services/types';

// A real climbing crag is never at exactly [0, 0] (null island), so we treat
// that (and out-of-range / non-finite values) as "no position".
export const isValidLonLat = (position: unknown): position is LonLat =>
  Array.isArray(position) &&
  position.length >= 2 &&
  Number.isFinite(position[0]) &&
  Number.isFinite(position[1]) &&
  !(position[0] === 0 && position[1] === 0) &&
  position[1] >= -90 &&
  position[1] <= 90 &&
  position[0] >= -180 &&
  position[0] <= 180;

// Relations sometimes come without a usable `center` (e.g. freshly resolved
// from the EditContext). Fall back to the centroid of the member positions so
// the map and newly added routes don't snap to [0, 0].
export const getValidCragCenter = (
  feature: Feature | undefined,
): LonLat | undefined => {
  if (!feature) return undefined;
  if (isValidLonLat(feature.center)) return feature.center;

  const memberCenters = (feature.memberFeatures ?? [])
    .map((member) => member.center)
    .filter(isValidLonLat);
  if (!memberCenters.length) return undefined;

  const sum = memberCenters.reduce(
    (acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat],
    [0, 0],
  );
  return [sum[0] / memberCenters.length, sum[1] / memberCenters.length];
};

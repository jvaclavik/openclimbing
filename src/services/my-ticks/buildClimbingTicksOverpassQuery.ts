import { ClimbingTick } from '../../types';
import { getApiId, isValidOsmShortId } from '../helpers';

/**
 * Overpass QL for OSM objects referenced by climbing ticks (same idea as Overpass Turbo).
 *
 * Example:
 * ```
 * [out:json][timeout:25];
 * (
 *   node(123);
 *   way(456);
 * );
 * out body geom qt;
 * ```
 */
export const buildClimbingTicksOverpassQuery = (
  ticks: ClimbingTick[],
): string | null => {
  const parts = ticks
    .map(({ shortId }) => {
      if (!isValidOsmShortId(shortId)) {
        return '';
      }
      const { id, type } = getApiId(shortId);
      return `${type}(${id});`;
    })
    .join('');

  if (!parts) {
    return null;
  }

  return `[out:json][timeout:25];(${parts});out body geom qt;`;
};

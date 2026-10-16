import { getDistance } from '../../../../services/getDistance';
import { getApiId } from '../../../../services/helpers';
import { DataItem } from '../context/types';

const MIN_MOVED_METERS = 1;

// Existing OSM nodes whose position changed, e.g. by the route "Distribute"
// tool. Easy to overlook, and it silently edits routes added by other mappers.
export const getMovedExistingItems = <T extends DataItem>(items: T[]) =>
  items.flatMap((item) => {
    const original = item.originalState.nodeLonLat;
    if (
      getApiId(item.shortId).id < 0 ||
      item.toBeDeleted ||
      !original ||
      !item.nodeLonLat
    ) {
      return [];
    }
    const meters = getDistance(item.nodeLonLat, original);
    return meters >= MIN_MOVED_METERS
      ? [{ item, meters: Math.round(meters) }]
      : [];
  });

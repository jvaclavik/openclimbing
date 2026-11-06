import { getApiId, getUrlOsmId } from '../../services/helpers';
import { UserListItem } from '../../services/my-lists/myListsTypes';
import { HAS_USER_DB } from '../../services/osm/consts';
import type { View } from '../utils/MapStateContext';

export const getListItemTarget = (item: UserListItem) => {
  const osmId = getApiId(item.shortId);
  if (!osmId.type || !Number.isFinite(osmId.id)) return { href: '/' };
  const path = `/${getUrlOsmId(osmId)}`;
  if (HAS_USER_DB || !item.center?.every(Number.isFinite))
    return { href: path };
  const [lon, lat] = item.center;
  const view: View = ['16', String(lat), String(lon)];
  return { href: `${path}#${view.join('/')}`, view };
};

import { Feature, LonLat } from '../types';
import { getShortId } from '../helpers';
import { getHumanPoiType } from '../../helpers/featureLabel';
import { getLabel } from '../../helpers/featureLabel';
import { UserListItem } from './myListsTypes';

export const featureToItem = (
  feature: Feature,
  fallbackCenter?: LonLat,
): Omit<UserListItem, 'addedAt'> => ({
  shortId: getShortId(feature.osmMeta),
  label: getLabel(feature),
  poiType: getHumanPoiType(feature),
  center: feature.center ?? fallbackCenter,
});

import { Feature, FeatureTags, LonLat } from '../../../../services/types';
import { getApiId, getShortId } from '../../../../services/helpers';
import { EditDataItem } from '../../EditDialog/context/types';
import { findInItems } from '../../EditDialog/context/utils';
import { averageLonLat, isValidLonLat } from './cragCenter';

export const isRouteTags = (tags: FeatureTags | undefined) =>
  tags?.climbing === 'route' || tags?.climbing === 'route_bottom';

// Resolve the crag (relation) item whose routes the position map should show.
// While creating a new sector the FeatureContext still points at the original
// node (or its parent), so we look the crag up in the EditContext instead: it's
// either the current item (when editing the crag itself) or the parent relation
// that lists the currently edited route as a member.
export const findCragItemForRoutes = (
  items: EditDataItem[],
  current: string,
  cragFeature: Feature | undefined,
): EditDataItem | undefined => {
  const currentItem = findInItems(items, current);
  if (currentItem?.tags?.climbing === 'crag') {
    return currentItem;
  }
  if (currentItem && isRouteTags(currentItem.tags)) {
    const parent = items.find(
      (item) =>
        item.tags?.climbing === 'crag' &&
        (item.members ?? []).some(
          (member) => member.shortId === currentItem.shortId,
        ),
    );
    if (parent) return parent;
  }
  return cragFeature
    ? findInItems(items, getShortId(cragFeature.osmMeta))
    : undefined;
};

// Does the crag have any route members in the current edit draft? (covers newly
// added routes that aren't part of the persisted memberFeatures yet)
export const cragHasRouteMembers = (
  items: EditDataItem[],
  cragItem: EditDataItem | undefined,
) =>
  (cragItem?.members ?? []).some((member) => {
    const item = findInItems(items, member.shortId);
    return isRouteTags(item?.tags);
  });

// A sector created in this dialog isn't part of any loaded OSM feature, so its
// position has to come from the draft: its own node position, the routes placed
// so far, or the node position it had before being converted to a relation.
// Without this, every new sector falls back to the same (panel or map) centre.
export const getDraftCragCenter = (
  items: EditDataItem[],
  cragItem: EditDataItem | undefined,
): LonLat | undefined => {
  if (!cragItem || getApiId(cragItem.shortId).id > 0) return undefined;
  if (isValidLonLat(cragItem.nodeLonLat)) return cragItem.nodeLonLat;

  const routesCenter = averageLonLat(
    (cragItem.members ?? [])
      .map((member) => findInItems(items, member.shortId)?.nodeLonLat)
      .filter(isValidLonLat),
  );
  if (routesCenter) return routesCenter;

  return isValidLonLat(cragItem.relationClickedLonLat)
    ? cragItem.relationClickedLonLat
    : undefined;
};

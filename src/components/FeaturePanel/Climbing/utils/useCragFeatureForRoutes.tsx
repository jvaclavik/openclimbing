import { useEffect, useMemo, useState } from 'react';
import { getApiId, getShortId } from '../../../../services/helpers';
import { Feature } from '../../../../services/types';
import { useEditContext } from '../../EditDialog/context/EditContext';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { fetchWithMemberFeatures } from '../../../../services/osm/fetchWithMemberFeatures';
import { findCragItemForRoutes, isRouteTags } from './cragRoutesItems';

const eachCragInTree = function* (
  feature: Feature | undefined,
): Generator<Feature> {
  const stack = [...(feature?.memberFeatures ?? [])];
  while (stack.length) {
    const current = stack.shift();
    if (!current) continue;
    if (current.tags?.climbing === 'crag') yield current;
    if (current.memberFeatures?.length) stack.push(...current.memberFeatures);
  }
};

// The crag in the member tree matching `targetShortId` (exact), or — when no
// target is known — the first crag found.
const findCragFeature = (
  feature: Feature | undefined,
  targetShortId: string | undefined,
): Feature | undefined => {
  let firstCrag: Feature | undefined;
  for (const crag of eachCragInTree(feature)) {
    if (!targetShortId) return crag;
    if (getShortId(crag.osmMeta) === targetShortId) return crag;
    if (!firstCrag) firstCrag = crag;
  }
  return targetShortId ? undefined : firstCrag;
};

const hasRouteMembers = (feature: Feature | undefined) =>
  (feature?.memberFeatures ?? []).some((member) => isRouteTags(member.tags));

/**
 * Resolves the crag feature whose routes the position map should show. When the
 * panel feature is the crag itself this is a no-op; when it's a climbing=area
 * (edited via the area's dialog) we pick the matching member crag out of the
 * loaded member tree instead.
 *
 * The OSM member tree is only loaded one level deep, so a crag reached via its
 * parent area carries no route members (unlike the crag the dialog was opened
 * on, which was fetched directly). We therefore fetch a crag's own members on
 * demand, so every crag shows its route positions consistently — not just the
 * one opened first.
 */
export const useCragFeatureForRoutes = (): Feature => {
  const { feature } = useFeatureContext();
  const { items, current } = useEditContext();
  const [fetchedCrags, setFetchedCrags] = useState<Record<string, Feature>>({});

  const { target, treeCrag } = useMemo(() => {
    const cragItem = findCragItemForRoutes(items, current, feature);
    // Only a real crag is a valid target; otherwise (e.g. the area is selected)
    // we leave it undefined so the first crag in the tree is shown, as before.
    const targetShortId =
      cragItem?.tags?.climbing === 'crag'
        ? cragItem.shortId
        : feature?.tags?.climbing === 'crag'
          ? getShortId(feature.osmMeta)
          : undefined;

    if (
      feature?.tags?.climbing === 'crag' &&
      (!targetShortId || getShortId(feature.osmMeta) === targetShortId)
    ) {
      return { target: targetShortId, treeCrag: feature };
    }
    return {
      target: targetShortId,
      treeCrag: findCragFeature(feature, targetShortId),
    };
  }, [feature, items, current]);

  // Fetch the target crag's own members when the copy we have lacks routes.
  useEffect(() => {
    if (!target || hasRouteMembers(treeCrag) || fetchedCrags[target]) {
      return undefined;
    }
    const apiId = getApiId(target);
    if (apiId.type !== 'relation' || apiId.id < 0) return undefined;

    let cancelled = false;
    fetchWithMemberFeatures(apiId)
      .then((full) => {
        if (!cancelled) {
          setFetchedCrags((prev) => ({ ...prev, [target]: full }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [target, treeCrag, fetchedCrags]);

  if (target && fetchedCrags[target] && !hasRouteMembers(treeCrag)) {
    return fetchedCrags[target];
  }
  return treeCrag ?? feature;
};

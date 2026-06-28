import { useEffect, useMemo, useState } from 'react';
import { getApiId, getShortId } from '../../../../services/helpers';
import { Feature } from '../../../../services/types';
import { useEditContext } from '../../EditDialog/context/EditContext';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { fetchWithMemberFeatures } from '../../../../services/osm/fetchWithMemberFeatures';
import { findCragItemForRoutes, isRouteTags } from './cragRoutesItems';
import { findInItems } from '../../EditDialog/context/utils';

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

// The crag in the member tree matching `targetShortId` (exact). When no target
// is known (e.g. a climbing=area is selected, whose members are crag relations)
// we deliberately resolve nothing — the map should stay empty until the user
// actually selects a crag or a route, rather than guessing the first crag.
const findCragFeature = (
  feature: Feature | undefined,
  targetShortId: string | undefined,
): Feature | undefined => {
  if (!targetShortId) return undefined;
  for (const crag of eachCragInTree(feature)) {
    if (getShortId(crag.osmMeta) === targetShortId) return crag;
  }
  return undefined;
};

const hasRouteMembers = (feature: Feature | undefined) =>
  (feature?.memberFeatures ?? []).some((member) => isRouteTags(member.tags));

// Module-level cache shared across all hook instances, so the several places
// that resolve the crag-for-routes (the map, `useHasCragRoutesMap`, the
// location editor…) don't each fire their own Overpass/OSM member fetch for
// the same crag. Keyed by the crag's shortId; the in-flight promise is cached
// too, to dedupe concurrent requests.
const cragMembersCache = new Map<string, Feature>();
const cragMembersPromises = new Map<string, Promise<Feature>>();

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
  const { items, current, activeCragId, setActiveCragId } = useEditContext();
  const [fetchedCrags, setFetchedCrags] = useState<Record<string, Feature>>({});

  const { target, treeCrag, liveTarget } = useMemo(() => {
    const cragItem = findCragItemForRoutes(items, current, feature);
    // The crag the current selection itself points at: the crag being edited,
    // or the parent crag of the edited route. An area resolves to nothing.
    const live =
      cragItem?.tags?.climbing === 'crag'
        ? cragItem.shortId
        : feature?.tags?.climbing === 'crag'
          ? getShortId(feature.osmMeta)
          : undefined;

    // When the current item is unrelated to climbing (a peak, cliff, …) keep
    // the previously shown crag on the map. But the area itself must clear it.
    const currentItem = findInItems(items, current);
    const currentIsArea = currentItem?.tags?.climbing === 'area';
    const effectiveTarget =
      live ?? (currentIsArea ? undefined : activeCragId || undefined);

    if (
      feature?.tags?.climbing === 'crag' &&
      (!effectiveTarget || getShortId(feature.osmMeta) === effectiveTarget)
    ) {
      return { target: effectiveTarget, treeCrag: feature, liveTarget: live };
    }
    return {
      target: effectiveTarget,
      treeCrag: findCragFeature(feature, effectiveTarget),
      liveTarget: live,
    };
  }, [feature, items, current, activeCragId]);

  // Remember the crag the current selection points at, so it stays visible when
  // the user later switches to an unrelated item within the same dialog.
  useEffect(() => {
    if (liveTarget && liveTarget !== activeCragId) {
      setActiveCragId(liveTarget);
    }
  }, [liveTarget, activeCragId, setActiveCragId]);

  // Fetch the target crag's own members when the copy we have lacks routes.
  useEffect(() => {
    if (!target || hasRouteMembers(treeCrag) || fetchedCrags[target]) {
      return undefined;
    }
    const apiId = getApiId(target);
    if (apiId.type !== 'relation' || apiId.id < 0) return undefined;

    const cached = cragMembersCache.get(target);
    if (cached) {
      setFetchedCrags((prev) => ({ ...prev, [target]: cached }));
      return undefined;
    }

    let cancelled = false;
    let promise = cragMembersPromises.get(target);
    if (!promise) {
      promise = fetchWithMemberFeatures(apiId);
      cragMembersPromises.set(target, promise);
    }
    promise
      .then((full) => {
        cragMembersCache.set(target, full);
        if (!cancelled) {
          setFetchedCrags((prev) => ({ ...prev, [target]: full }));
        }
      })
      .catch(() => {
        cragMembersPromises.delete(target); // allow a retry later
      });
    return () => {
      cancelled = true;
    };
  }, [target, treeCrag, fetchedCrags]);

  if (target && !hasRouteMembers(treeCrag)) {
    const resolved = fetchedCrags[target] ?? cragMembersCache.get(target);
    if (resolved) return resolved;
  }
  return treeCrag ?? feature;
};

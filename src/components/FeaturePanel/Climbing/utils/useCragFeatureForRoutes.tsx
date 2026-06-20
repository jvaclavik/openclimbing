import { useMemo } from 'react';
import { getShortId } from '../../../../services/helpers';
import { Feature } from '../../../../services/types';
import { useEditContext } from '../../EditDialog/context/EditContext';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { findCragItemForRoutes } from './cragRoutesItems';

// Breadth-first search through the (recursively loaded) member tree for the crag
// whose routes we want. Prefers the one matching `targetShortId`, otherwise
// falls back to the first crag found.
const findCragFeature = (
  feature: Feature | undefined,
  targetShortId: string | undefined,
): Feature | undefined => {
  const stack = [...(feature?.memberFeatures ?? [])];
  let firstCrag: Feature | undefined;
  while (stack.length) {
    const current = stack.shift();
    if (!current) continue;
    if (current.tags?.climbing === 'crag') {
      if (targetShortId && getShortId(current.osmMeta) === targetShortId) {
        return current;
      }
      if (!firstCrag) firstCrag = current;
    }
    if (current.memberFeatures?.length) stack.push(...current.memberFeatures);
  }
  return firstCrag;
};

/**
 * Resolves the crag feature whose routes the position map should show. When the
 * panel feature is the crag itself this is a no-op; when it's a climbing=area
 * (edited via the area's dialog), the routes live on the nested member crag, so
 * we pick that crag out of the recursively-loaded member tree instead.
 */
export const useCragFeatureForRoutes = (): Feature => {
  const { feature } = useFeatureContext();
  const { items, current } = useEditContext();

  return useMemo(() => {
    if (feature?.tags?.climbing === 'crag') return feature;
    const cragItem = findCragItemForRoutes(items, current, feature);
    const targetShortId = cragItem?.shortId ?? current;
    return findCragFeature(feature, targetShortId) ?? feature;
  }, [feature, items, current]);
};

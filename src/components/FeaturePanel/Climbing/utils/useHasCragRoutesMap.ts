import { useFeatureContext } from '../../../utils/FeatureContext';
import { useEditContext } from '../../EditDialog/context/EditContext';
import {
  cragHasRouteMembers,
  findCragItemForRoutes,
  isRouteTags,
} from './cragRoutesItems';
import { useCragFeatureForRoutes } from './useCragFeatureForRoutes';

// True when the panel feature is a crag that actually has route members, so
// the shared crag map (with all route markers) makes sense for the current
// item — both for the crag itself and for an individual route being edited.
export const useHasCragRoutesMap = () => {
  const { feature } = useFeatureContext();
  const { items, current } = useEditContext();

  // The crag whose routes the map shows — resolved (and its members fetched on
  // demand) even when we reached the crag from a parent area. As soon as those
  // members arrive the whole crag's routes should show, without waiting for the
  // user to click into an individual route first.
  const cragForRoutes = useCragFeatureForRoutes();

  // Persisted OSM data already has route members.
  if (
    (feature?.memberFeatures ?? []).some((member) =>
      isRouteTags(member.tags),
    ) ||
    (cragForRoutes?.memberFeatures ?? []).some((member) =>
      isRouteTags(member.tags),
    )
  ) {
    return true;
  }

  // …or the current edit draft does (e.g. a brand-new sector with new routes).
  const cragItem = findCragItemForRoutes(items, current, feature);
  return cragHasRouteMembers(items, cragItem);
};

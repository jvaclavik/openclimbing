import { useEffect, useRef } from 'react';
import { getShortId, getApiId } from '../../../services/helpers';
import { PROJECT_ID } from '../../../services/project';
import { useEditContext } from './context/EditContext';
import { useEditDialogFeature } from './utils';
import {
  addOpenClimbingWebsite,
  featureHasDrawnRoutes,
  getOpenClimbingUrl,
  hasOpenClimbingLink,
  isCragOrArea,
  itemHasDrawnRoutes,
  removeOpenClimbingWebsite,
} from './openClimbingWebsite';

/**
 * The link is offered only for the crag/area the dialog was opened on – that is
 * the only item for which we have the members (and for areas the whole tree)
 * needed to tell whether it has routes drawn on photos.
 */
export const useOpenClimbingWebsite = () => {
  const { feature } = useEditDialogFeature();
  const { items, openClimbingLinkOptOut, setOpenClimbingLinkOptOut } =
    useEditContext();

  const shortId = getShortId(feature.osmMeta);
  const item = items.find((candidate) => candidate.shortId === shortId);
  const originalTags = item?.originalState?.tags ?? {};

  const isActive =
    PROJECT_ID === 'openclimbing' &&
    !!item &&
    getApiId(shortId).id > 0 &&
    isCragOrArea(originalTags) &&
    !hasOpenClimbingLink(originalTags) &&
    (featureHasDrawnRoutes(feature) || itemHasDrawnRoutes(item));

  return {
    isActive,
    item,
    url: getOpenClimbingUrl(shortId),
    optOut: openClimbingLinkOptOut,
    setOptOut: setOpenClimbingLinkOptOut,
  };
};

/**
 * Adds the link right after the item is loaded, and shifts it back out when the
 * user opts out. Both directions are a plain rewrite of the website* slots, so
 * no other data is touched and nothing has to be remembered. It runs only on
 * the transitions – a tag the user edits by hand afterwards is left alone.
 */
export const useApplyOpenClimbingWebsite = () => {
  const { isActive, item, url, optOut } = useOpenClimbingWebsite();
  const appliedRef = useRef<boolean>(undefined);

  useEffect(() => {
    if (!isActive) return;

    const shouldBeApplied = !optOut;
    if (appliedRef.current === shouldBeApplied) return;
    appliedRef.current = shouldBeApplied;

    item.setTagsEntries((prev) =>
      shouldBeApplied
        ? addOpenClimbingWebsite(prev, url)
        : removeOpenClimbingWebsite(prev, url),
    );
  }, [isActive, item, optOut, url]);
};

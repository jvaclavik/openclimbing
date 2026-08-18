import { useMemo } from 'react';
import { getShortId } from '../../../../../services/helpers';
import { PathWithTags } from '../../../FeatureImages/PathsSvg';
import { useCurrentItem, useEditContext } from '../../context/EditContext';
import { useEditDialogFeature } from '../../utils';
import { collectPhotoPaths, PathSource } from './wikimediaCommonsPhotoPaths';

/**
 * Members of the currently edited item as path sources. Members already loaded
 * into EditContext win, so the preview reacts live to the tags being edited;
 * the rest falls back to the member features loaded with the feature panel, so
 * the lines are there before the user opens any member.
 */
const useMemberPathSources = (): PathSource[] => {
  const { items } = useEditContext();
  const { shortId, members } = useCurrentItem();
  const { feature } = useEditDialogFeature();

  return useMemo(() => {
    const isSameFeature =
      feature?.osmMeta && getShortId(feature.osmMeta) === shortId;
    const memberFeatures = isSameFeature ? feature.memberFeatures : undefined;

    return (members ?? [])
      .map((member) => {
        const item = items.find(({ shortId: id }) => id === member.shortId);
        if (item) {
          return item.toBeDeleted
            ? undefined
            : { shortId: item.shortId, tags: item.tags };
        }

        const memberFeature = memberFeatures?.find(
          ({ osmMeta }) => getShortId(osmMeta) === member.shortId,
        );
        return memberFeature
          ? { shortId: member.shortId, tags: memberFeature.tags }
          : undefined;
      })
      .filter((source) => source != null);
  }, [feature, items, members, shortId]);
};

/** Lines to draw over each photo preview of the currently edited item. */
export const useWikimediaCommonsPhotoPaths = (
  fileKeys: string[],
): Record<string, PathWithTags[]> => {
  const { shortId, tags } = useCurrentItem();
  const memberSources = useMemberPathSources();

  return useMemo(
    () => collectPhotoPaths({ shortId, tags }, memberSources, fileKeys),
    [fileKeys, memberSources, shortId, tags],
  );
};

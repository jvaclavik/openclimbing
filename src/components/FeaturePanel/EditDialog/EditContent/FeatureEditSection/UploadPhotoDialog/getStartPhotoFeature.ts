import { Feature, FeatureTags } from '../../../../../../services/types';
import { getShortId } from '../../../../../../services/helpers';

type Item = { shortId: string; tags: FeatureTags };

// Uploads are named and described after the opened feature. A start photo
// belongs to a single route though, which – when edited from its crag – is
// only one of the crag's members.
export const getStartPhotoFeature = (feature: Feature, item: Item): Feature => {
  if (getShortId(feature.osmMeta) === item.shortId) {
    return feature;
  }
  const member = feature.memberFeatures?.find(
    ({ osmMeta }) => getShortId(osmMeta) === item.shortId,
  );
  return {
    ...(member ?? feature),
    tags: item.tags, // edited tags, eg. the name of a route which isn't saved yet
    parentFeatures: [feature, ...(feature.parentFeatures ?? [])],
    countryCode: member?.countryCode ?? feature.countryCode,
  };
};

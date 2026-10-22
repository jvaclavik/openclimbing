import { intl } from '../../../services/intl';
import { PROJECT_ID } from '../../../services/project';
import { Feature, FeatureTags } from '../../../services/types';

export const isOpenClimbingSelfLink = (value: string) =>
  PROJECT_ID === 'openclimbing' &&
  value.startsWith('https://openclimbing.org/');

const placeName = (feature: Feature | undefined) => {
  if (!feature?.tags) return undefined;
  const localized = intl.lang
    ? feature.tags[`name:${intl.lang}`]?.trim()
    : undefined;
  return localized || feature.tags.name?.trim() || undefined;
};

const nearestArea = (feature: Feature) =>
  feature.parentFeatures?.find((parent) => parent.tags?.climbing === 'area');

const isDisallowed = (tags: FeatureTags) =>
  tags.climbing === 'no' || tags.climbing === 'prohibited';

const isRoute = (tags: FeatureTags) =>
  ['route', 'route_bottom', 'abseil_route'].includes(tags.climbing);

const isFerrata = (tags: FeatureTags) =>
  tags.highway === 'via_ferrata' ||
  tags.route === 'via_ferrata' ||
  tags.sport === 'via_ferrata' ||
  !!tags.via_ferrata_scale;

const hasClimbingTags = (tags: FeatureTags) =>
  tags.sport === 'climbing' ||
  tags.leisure === 'climbing' ||
  isFerrata(tags) ||
  Object.keys(tags).some((key) => key.startsWith('climbing'));

const isClimbingRelated = (feature: Feature) => {
  if (
    feature.tags &&
    !isDisallowed(feature.tags) &&
    hasClimbingTags(feature.tags)
  ) {
    return true;
  }
  return (feature.parentFeatures ?? []).some(
    (parent) =>
      parent.tags && !isDisallowed(parent.tags) && hasClimbingTags(parent.tags),
  );
};

// Mirrors which records get type "crag" in getNewRecords, i.e. the crag pin.
const isShownAsCragIcon = (feature: Feature) => {
  const tags = feature.tags;
  const osmType = feature.osmMeta?.type;
  if (!tags || !osmType || isDisallowed(tags)) return false;
  const related = isClimbingRelated(feature);

  if (osmType === 'node') {
    if (tags.climbing === 'area') return false;
    if (
      tags.climbing === 'crag' ||
      tags.climbing === 'boulder' ||
      (tags.natural === 'peak' && related)
    ) {
      return true;
    }
    if (isRoute(tags) || tags.climbing === 'route_top') return false;
    if ((tags.leisure || tags.building) && related) return false;
    if (tags.playground || isFerrata(tags)) return false;
    if (tags.sport !== 'climbing') return false;
    return !(tags.man_made || tags.name?.match(/gym/i));
  }

  if (osmType === 'way') {
    if (isRoute(tags) || isFerrata(tags)) return false;
    if ((tags.leisure || tags.building) && related) return false;
    if (tags.climbing === 'area' || tags.playground) return false;
    return Boolean(tags.climbing || tags.sport === 'climbing');
  }

  if (isFerrata(tags) || tags.climbing === 'area') return false;
  if ((tags.leisure || tags.building) && related) return false;
  if (tags.playground) return false;
  return Boolean(
    tags.climbing ||
      tags.sport === 'climbing' ||
      ((tags.type === 'site' || tags.type === 'multipolygon') && related),
  );
};

// Query is the area name and this place's name, so a shared name still points
// at the right rock. Shown for every map feature that uses the crag pin.
export const climbingGoogleSearch = (feature: Feature) => {
  if (!isShownAsCragIcon(feature)) return null;

  const areaName = placeName(nearestArea(feature));
  const cragName = placeName(feature);
  const names = [areaName, cragName].filter(
    (name, index, all): name is string =>
      Boolean(name) && all.indexOf(name) === index,
  );
  if (!names.length) return null;

  const query = names.join(' ');
  return {
    query,
    href: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  };
};

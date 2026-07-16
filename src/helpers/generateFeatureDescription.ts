import { Feature, TranslationId } from '../services/types';
import { t } from '../services/intl';
import { getHumanPoiType, getLabel, getParentLabel } from './featureLabel';
import {
  getClimbingAttributes,
  mergeClimbingAttributes,
} from '../services/tagging/climbing/climbingAttributes';
import {
  findGradeTableRowIndexForGradeText,
  getDifficulty,
} from '../services/tagging/climbing/routeGrade';
import { getGradeSystemName } from '../services/tagging/climbing/gradeSystems';
import { CLIMBING_ROCK_OPTIONS } from '../services/tagging/climbing/climbingRockData';

const translateClimbingTypes = (types: string[]) =>
  types.map((type) => t(`climbing_badges.${type}_label` as TranslationId));

const translateRock = (rock: string) => {
  const option = CLIMBING_ROCK_OPTIONS.find((item) => item.value === rock);
  return option ? t(option.translationKey) : rock;
};

const isClimbingRouteTags = (feature: Feature) =>
  feature.tags?.climbing === 'route' ||
  feature.tags?.climbing === 'route_bottom';

const getClimbingPoiType = (feature: Feature): string => {
  switch (feature.tags?.climbing) {
    case 'area':
      return t('seo.type.area');
    case 'crag':
      return t('seo.type.crag');
    case 'route':
    case 'route_bottom':
      return t('seo.type.route');
    default:
      return getHumanPoiType(feature);
  }
};

const collectRoutes = (feature: Feature): Feature[] => {
  const routes: Feature[] = [];
  const walk = (f?: Feature) => {
    if (!f) return;
    if (isClimbingRouteTags(f)) {
      routes.push(f);
    }
    f.memberFeatures?.forEach((child) => walk(child as Feature));
  };
  feature.memberFeatures?.forEach((child) => walk(child as Feature));
  return routes;
};

const getGradeRangeLabel = (features: Feature[]): string | null => {
  const graded = features
    .map((feature) => getDifficulty(feature.tags))
    .filter((diff) => !!diff?.grade)
    .map((diff) => ({
      diff,
      index: findGradeTableRowIndexForGradeText(diff.grade),
    }))
    .filter((item) => item.index != null)
    .sort((a, b) => a.index - b.index);

  if (!graded.length) {
    return null;
  }

  const min = graded[0].diff;
  const max = graded[graded.length - 1].diff;
  const system = getGradeSystemName(min.gradeSystem) ?? min.gradeSystem;

  return min.grade === max.grade
    ? `${min.grade} (${system})`
    : `${min.grade}–${max.grade} (${system})`;
};

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Builds a unique, data-driven description used as the SEO meta description and
 * JSON-LD description fallback (when the feature has no `description` tag). This
 * turns otherwise thin/duplicate feature pages into unique, indexable content.
 */
export const generateFeatureDescription = (feature: Feature): string | null => {
  const tags = feature.tags ?? {};
  if (!tags.climbing) {
    return null;
  }

  const parts: string[] = [];

  if (isClimbingRouteTags(feature)) {
    const diff = getDifficulty(tags);
    if (diff?.grade) {
      const system = getGradeSystemName(diff.gradeSystem) ?? diff.gradeSystem;
      parts.push(t('seo.grade', { grade: `${diff.grade} (${system})` }));
    }
    if (tags['climbing:length']) {
      parts.push(t('seo.length', { length: tags['climbing:length'] }));
    }
    const attrs = getClimbingAttributes(tags);
    if (attrs.climbingTypes.length) {
      parts.push(translateClimbingTypes(attrs.climbingTypes).join(', '));
    }
    if (attrs.materials.length) {
      parts.push(
        t('seo.rock', { rock: attrs.materials.map(translateRock).join(', ') }),
      );
    }
  } else {
    const routes = collectRoutes(feature);
    if (routes.length) {
      parts.push(t('seo.routes', { count: routes.length }));
    }
    const gradeRange = getGradeRangeLabel([feature, ...routes]);
    if (gradeRange) {
      parts.push(t('seo.grades', { range: gradeRange }));
    }
    const attrs = mergeClimbingAttributes([
      getClimbingAttributes(tags),
      ...routes.map((route) => getClimbingAttributes(route.tags)),
    ]);
    if (attrs.climbingTypes.length) {
      parts.push(translateClimbingTypes(attrs.climbingTypes).join(', '));
    }
    if (attrs.materials.length) {
      parts.push(
        t('seo.rock', { rock: attrs.materials.map(translateRock).join(', ') }),
      );
    }
  }

  if (!parts.length) {
    return null;
  }

  const name = getLabel(feature);
  const poiType = getClimbingPoiType(feature);
  const parentLabel = getParentLabel(feature);
  const prefix = parentLabel
    ? `${name} – ${poiType}, ${parentLabel}`
    : `${name} – ${poiType}`;

  return `${prefix}. ${capitalize(parts.join(', '))}. ${t('seo.suffix')}`;
};

import {
  getApiId,
  getShortId,
  normalizeOsmShortIdKey,
} from '../../services/helpers';
import {
  getDifficulties,
  findOrConvertRouteGrade,
  getOsmTagFromGradeSystem,
} from '../../services/tagging/climbing/routeGrade';
import { GradeSystem } from '../../services/tagging/climbing/gradeSystems';
import { OverpassFeature } from '../../services/overpass/overpassSearch';
import { ClimbingTick } from '../../types';
import { TickStyle } from '../FeaturePanel/Climbing/types';
import { publishDbgObject } from '../../utils';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';

const mergeTagsForTick = (
  tick: ClimbingTick,
  feature: OverpassFeature | undefined,
  gradeSystem: GradeSystem,
): Record<string, string> | undefined => {
  const base = { ...(feature?.tags ?? {}) } as Record<string, string>;
  const fromDb = tick.routeGradeTxt?.trim();
  if (fromDb) {
    for (const k of Object.keys(base)) {
      if (k.startsWith('climbing:grade')) {
        delete base[k];
      }
    }
    base[getOsmTagFromGradeSystem(gradeSystem)] = fromDb;
  }
  return Object.keys(base).length ? base : undefined;
};

export const fetchedTicksToGraphFeatures = (
  rows: FetchedClimbingTick[],
): OverpassFeature[] =>
  rows.map((r) => {
    const coords =
      r.center && r.center.length >= 2
        ? r.center
        : ([0, 0] as [number, number]);
    return {
      type: 'Feature',
      osmMeta: r.apiId,
      tags: (r.tags ?? {}) as Record<string, string>,
      properties: {},
      geometry: { type: 'Point', coordinates: coords },
      center: r.center?.length >= 2 ? r.center : undefined,
    } as OverpassFeature;
  });

const tickToFetchedRow = (
  tick: ClimbingTick,
  feature: OverpassFeature | undefined,
  gradeSystem: GradeSystem,
  index: number,
): FetchedClimbingTick => {
  const tags = mergeTagsForTick(tick, feature, gradeSystem);
  const difficulties = getDifficulties(tags);
  const { routeDifficulty } = findOrConvertRouteGrade(
    difficulties,
    gradeSystem,
  );
  const fromDbName = tick.routeName?.trim();
  const fromFeatureName =
    feature?.tags?.name?.trim() ||
    feature?.tags?.['name:en']?.trim() ||
    feature?.tags?.['loc_name']?.trim() ||
    feature?.tags?.ref?.trim() ||
    '';
  const centerFromDb =
    tick.routeLon != null &&
    tick.routeLat != null &&
    Number.isFinite(tick.routeLon) &&
    Number.isFinite(tick.routeLat)
      ? [tick.routeLon, tick.routeLat]
      : undefined;
  return {
    key: `${tick.shortId}-${tick.timestamp}`,
    name: fromDbName || fromFeatureName,
    grade: routeDifficulty.grade,
    center:
      centerFromDb ??
      (feature?.center && feature.center.length >= 2
        ? feature.center
        : undefined),
    index,
    date: tick.timestamp,
    style: tick.style as TickStyle,
    apiId: getApiId(tick.shortId!),
    tags,
    tick,
  };
};

export const mapFeaturesDataToTicks = (
  ticks: ClimbingTick[],
  features: OverpassFeature[],
  gradeSystem: GradeSystem,
): FetchedClimbingTick[] => {
  const featureMap: Record<string, OverpassFeature> = {};
  for (const feature of features) {
    const key = normalizeOsmShortIdKey(getShortId(feature.osmMeta));
    featureMap[key] = feature;
  }

  const tickRows = ticks
    .filter((tick) => tick.shortId)
    .map((tick, index) =>
      tickToFetchedRow(
        tick,
        featureMap[normalizeOsmShortIdKey(tick.shortId)],
        gradeSystem,
        index,
      ),
    );

  publishDbgObject('tickRows', tickRows);

  return tickRows;
};

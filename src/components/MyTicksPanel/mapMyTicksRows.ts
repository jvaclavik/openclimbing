import { getApiId, getShortId } from '../../services/helpers';
import { getDifficulties } from '../../services/tagging/climbing/routeGrade';
import { findOrConvertRouteGrade } from '../../services/tagging/climbing/routeGrade';
import { GradeSystem } from '../../services/tagging/climbing/gradeSystems';
import { OverpassFeature } from '../../services/overpass/overpassSearch';
import { ClimbingTick } from '../../types';
import { TickStyle } from '../FeaturePanel/Climbing/types';
import { publishDbgObject } from '../../utils';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';

export const mapFeaturesDataToTicks = (
  ticks: ClimbingTick[],
  features: OverpassFeature[],
  gradeSystem: GradeSystem,
): FetchedClimbingTick[] => {
  const featureMap = Object.keys(features).reduce((acc, key) => {
    const feature = features[key];
    return {
      ...acc,
      [getShortId(feature.osmMeta)]: feature,
    };
  }, {});

  const tickRows = ticks
    .filter((tick) => tick.shortId)
    .map((tick: ClimbingTick, index) => {
      const feature = featureMap[tick.shortId];
      const difficulties = getDifficulties(feature?.tags);
      const { routeDifficulty } = findOrConvertRouteGrade(
        difficulties,
        gradeSystem,
      );

      return {
        key: `${tick.shortId}-${tick.timestamp}`, // TODO tick.id
        name: feature?.tags?.name,
        grade: routeDifficulty.grade,
        center: feature?.center,
        index,
        date: tick.timestamp,
        style: tick.style as TickStyle,
        apiId: getApiId(tick.shortId),
        tags: feature?.tags,
        tick,
      };
    });

  publishDbgObject('tickRows', tickRows);

  return tickRows;
};

import { ClimbingTilesFeature } from '../../../types';
import {
  bbox,
  buffer,
  convex,
  distance,
  featureCollection,
  lineString,
  polygonSmooth,
} from '@turf/turf';
import { Feature as GeojsonFeature, LineString, Polygon } from 'geojson';

// buffer() measures its `degrees` radius on a great circle, so it is a plain
// ground distance regardless of latitude
const METERS_PER_BUFFER_DEGREE = 111195;

// a tightly packed crag would otherwise get an outline hugging the routes,
// barely bigger than the marker standing on it
const MIN_INFLATION_METERS = 10;

const getMeasures = (hull: GeojsonFeature<Polygon | LineString>) => {
  const [minX, minY, maxX, maxY] = bbox(hull);
  const width = maxX - minX;
  const height = maxY - minY;
  const maxDimension = Math.max(width, height);

  const inflation = Math.max(
    maxDimension * 0.1,
    MIN_INFLATION_METERS / METERS_PER_BUFFER_DEGREE,
  );

  const meters = distance([minX, minY], [maxX, maxY], { units: 'meters' });
  const minZoom = Math.log2((5 * 40075016) / (meters * 256));

  return { inflation, minZoom };
};

const getHullForSubfeatures = (
  features: ClimbingTilesFeature[],
  mapId: number,
) => {
  const relationId = Math.floor(mapId / 10);
  const subfeatures = features.filter(
    (f) => f.properties.parentId === relationId,
  );
  if (subfeatures.length <= 1) {
    return null;
  }

  const hull = convex(featureCollection(subfeatures));
  if (!hull) {
    // two points or colinear points --> make a straight line
    const coords = subfeatures.flatMap((f) =>
      f.geometry.type === 'Point' ? [f.geometry.coordinates] : [],
    );
    if (coords.length < 2) {
      return null; // TODO the other could be a LineString, check #14.35/37.7343/-119.6216
    }
    return lineString(coords);
  }
  return hull;
};

export const constructOutlines = (features: ClimbingTilesFeature[]) => {
  // takes ~ 10-90ms
  return features
    .filter(({ id }) => (id as number) % 10 === 4)
    .flatMap((relation) => {
      const mapId = relation.id as number;
      const hull = getHullForSubfeatures(features, mapId);
      if (!hull) {
        return [];
      }

      const { inflation, minZoom } = getMeasures(hull);
      const buffered = buffer(hull, inflation, { units: 'degrees' });
      // buffer() returns undefined when the projected geometry yields NaN
      // coordinates (degenerate inputs). Skip the outline in that case.
      if (!buffered) {
        return [];
      }
      const smooth = polygonSmooth(buffered, { iterations: 3 });

      return [
        {
          ...smooth.features[0],
          id: mapId,
          properties: {
            type: 'outline',
            minZoom,
          },
        } as GeojsonFeature<Polygon>,
      ];
    });
};

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

// ~10 % of the longer side of a square bbox, just measured on its diagonal
const INFLATION_RATIO = 0.07;

const getMeasures = (hull: GeojsonFeature<Polygon | LineString>) => {
  const [minX, minY, maxX, maxY] = bbox(hull);
  const diagonalMeters = distance([minX, minY], [maxX, maxY], {
    units: 'meters',
  });

  const inflationMeters = Math.max(
    diagonalMeters * INFLATION_RATIO,
    MIN_INFLATION_METERS,
  );
  const inflation = inflationMeters / METERS_PER_BUFFER_DEGREE;

  // routes mapped on a single node give a zero diagonal (--> minZoom Infinity),
  // yet the outline is still drawn as a circle of the inflation radius
  const outlineMeters = Math.max(diagonalMeters, 2 * inflationMeters);
  const minZoom = Math.log2((5 * 40075016) / (outlineMeters * 256));

  return { inflation, minZoom };
};

const isRelation = (feature: ClimbingTilesFeature) =>
  (feature.id as number) % 10 === 4;

const toRelationId = (mapId: number) => Math.floor(mapId / 10);

type ChildrenByParent = Map<number, ClimbingTilesFeature[]>;

const getChildrenByParent = (features: ClimbingTilesFeature[]) => {
  const childrenByParent: ChildrenByParent = new Map();
  for (const feature of features) {
    const { parentId } = feature.properties;
    if (parentId === undefined) {
      continue;
    }
    const siblings = childrenByParent.get(parentId);
    if (siblings) {
      siblings.push(feature);
    } else {
      childrenByParent.set(parentId, [feature]);
    }
  }
  return childrenByParent;
};

// an area holds only its child crags, and those hold the routes - so the hull
// has to be built from the whole subtree, not just from the direct children
const getSubtree = (childrenByParent: ChildrenByParent, relationId: number) => {
  const subtree: ClimbingTilesFeature[] = [];
  const visited = new Set([relationId]);
  const queue = [relationId];

  while (queue.length) {
    const parentId = queue.pop();
    for (const child of childrenByParent.get(parentId) ?? []) {
      subtree.push(child);
      const childId = toRelationId(child.id as number);
      if (isRelation(child) && !visited.has(childId)) {
        visited.add(childId);
        queue.push(childId);
      }
    }
  }

  return subtree;
};

const getHullForSubfeatures = (
  childrenByParent: ChildrenByParent,
  mapId: number,
) => {
  const subfeatures = getSubtree(childrenByParent, toRelationId(mapId));
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
  const childrenByParent = getChildrenByParent(features);

  return features.filter(isRelation).flatMap((relation) => {
    const mapId = relation.id as number;
    const hull = getHullForSubfeatures(childrenByParent, mapId);
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

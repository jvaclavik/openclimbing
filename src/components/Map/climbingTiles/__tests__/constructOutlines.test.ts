import { bbox, distance } from '@turf/turf';
import { constructOutlines } from '../constructOutlines';
import { ClimbingTilesFeature } from '../../../../types';

const RELATION_ID = 1763802;
const CRAG_LON = 14.1305;
const CRAG_LAT = 49.945;

const METERS_PER_LAT_DEGREE = 111320;
const METERS_PER_LON_DEGREE =
  METERS_PER_LAT_DEGREE * Math.cos((CRAG_LAT * Math.PI) / 180);

const crag: ClimbingTilesFeature = {
  type: 'Feature',
  id: RELATION_ID * 10 + 4,
  geometry: { type: 'Point', coordinates: [CRAG_LON, CRAG_LAT] },
  properties: { type: 'crag', name: 'crag' },
};

// routes zig-zagging along a wall of the given size, like a real crag
const wall = (
  count: number,
  widthMeters: number,
  heightMeters: number,
  parentId = RELATION_ID,
  offsetMeters = 0,
): ClimbingTilesFeature[] =>
  Array.from({ length: count }, (_, i) => {
    const along = i / (count - 1);
    const across = i % 2 === 0 ? 0 : 1;
    return {
      type: 'Feature' as const,
      id: (parentId + 1 + i) * 10 + 1,
      geometry: {
        type: 'Point' as const,
        coordinates: [
          CRAG_LON +
            (offsetMeters + across * widthMeters) / METERS_PER_LON_DEGREE,
          CRAG_LAT + (along * heightMeters) / METERS_PER_LAT_DEGREE,
        ],
      },
      properties: {
        type: 'route' as const,
        name: `r${i}`,
        parentId,
      },
    };
  });

const relation = (
  id: number,
  parentId: number | undefined,
  offsetMeters: number,
): ClimbingTilesFeature => ({
  type: 'Feature',
  id: id * 10 + 4,
  geometry: {
    type: 'Point',
    coordinates: [CRAG_LON + offsetMeters / METERS_PER_LON_DEGREE, CRAG_LAT],
  },
  properties: { type: 'area', name: `a${id}`, parentId },
});

const getSizeMeters = (features: ClimbingTilesFeature[]) => {
  const outlines = constructOutlines(features);
  expect(outlines).toHaveLength(1);
  expect(outlines[0].id).toBe(RELATION_ID * 10 + 5);
  expect(outlines[0].id).not.toBe(crag.id);
  const [minX, minY, maxX, maxY] = bbox(outlines[0]);
  return {
    width: distance([minX, minY], [maxX, minY], { units: 'meters' }),
    height: distance([minX, minY], [minX, maxY], { units: 'meters' }),
  };
};

describe('constructOutlines', () => {
  it('keeps a minimum gap around a tightly packed crag', () => {
    const { width, height } = getSizeMeters([...wall(18, 14, 22), crag]);

    // 14 x 22m of routes + ~10m of padding on each side
    expect(width).toBeGreaterThan(30);
    expect(width).toBeLessThan(36);
    expect(height).toBeGreaterThan(38);
    expect(height).toBeLessThan(45);
  });

  it('scales the padding with the size of a large crag', () => {
    const { width, height } = getSizeMeters([...wall(96, 60, 200), crag]);

    // 7% of the ~209m diagonal is already above the minimum
    expect(width).toBeGreaterThan(85);
    expect(width).toBeLessThan(93);
    expect(height).toBeGreaterThan(225);
    expect(height).toBeLessThan(233);
  });

  it('pads a wall the same way regardless of its orientation', () => {
    const northSouth = getSizeMeters([...wall(96, 60, 200), crag]);
    const eastWest = getSizeMeters([...wall(96, 200, 60), crag]);

    expect(eastWest.width).toBeCloseTo(northSouth.height, 0);
    expect(eastWest.height).toBeCloseTo(northSouth.width, 0);
  });

  it('skips a relation without at least two subfeatures', () => {
    expect(constructOutlines([...wall(2, 14, 22).slice(0, 1), crag])).toEqual(
      [],
    );
  });

  it('gives a finite minZoom to a boulder with all routes on one node', () => {
    const routes = wall(5, 0, 0).map((route) => ({
      ...route,
      geometry: { type: 'Point' as const, coordinates: [CRAG_LON, CRAG_LAT] },
    }));

    const [outline] = constructOutlines([...routes, crag]);

    expect(Number.isFinite(outline.properties.minZoom)).toBe(true);
  });

  it('spans the whole subtree of a nested area, not just its child crags', () => {
    const AREA_ID = 900000;
    const SUB_ID = 900001;
    const features = [
      relation(AREA_ID, undefined, 0),
      relation(SUB_ID, AREA_ID, 200),
      { ...crag, properties: { ...crag.properties, parentId: AREA_ID } },
      ...wall(8, 14, 22), // routes of the crag
      ...wall(8, 14, 22, SUB_ID, 500), // routes of the nested area
    ];

    const [minX, , maxX] = bbox(
      constructOutlines(features).find((o) => o.id === AREA_ID * 10 + 5),
    );
    const width = distance([minX, CRAG_LAT], [maxX, CRAG_LAT], {
      units: 'meters',
    });

    // the two child relations sit 200m apart, their routes reach out to ~515m
    expect(width).toBeGreaterThan(500);
  });

  it('survives a cycle in the parent chain', () => {
    const A = 900010;
    const B = 900011;
    const features = [
      { ...relation(A, B, 0), properties: { type: 'area', parentId: B } },
      relation(B, A, 200),
      ...wall(4, 14, 22, A),
    ] as ClimbingTilesFeature[];

    expect(() => constructOutlines(features)).not.toThrow();
  });
});

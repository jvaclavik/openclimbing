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
): ClimbingTilesFeature[] =>
  Array.from({ length: count }, (_, i) => {
    const along = i / (count - 1);
    const across = i % 2 === 0 ? 0 : 1;
    return {
      type: 'Feature' as const,
      id: (RELATION_ID + 1 + i) * 10 + 1,
      geometry: {
        type: 'Point' as const,
        coordinates: [
          CRAG_LON + (across * widthMeters) / METERS_PER_LON_DEGREE,
          CRAG_LAT + (along * heightMeters) / METERS_PER_LAT_DEGREE,
        ],
      },
      properties: {
        type: 'route' as const,
        name: `r${i}`,
        parentId: RELATION_ID,
      },
    };
  });

const getSizeMeters = (features: ClimbingTilesFeature[]) => {
  const outlines = constructOutlines(features);
  expect(outlines).toHaveLength(1);
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
    const { width, height } = getSizeMeters([...wall(96, 26, 95), crag]);

    // 10% of the 95m hull is already above the minimum
    expect(width).toBeGreaterThan(43);
    expect(width).toBeLessThan(50);
    expect(height).toBeGreaterThan(110);
    expect(height).toBeLessThan(120);
  });

  it('skips a relation without at least two subfeatures', () => {
    expect(constructOutlines([...wall(2, 14, 22).slice(0, 1), crag])).toEqual(
      [],
    );
  });
});

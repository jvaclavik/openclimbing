import {
  buildTicksCsv,
  buildTicksCsvFilename,
} from '../exportTicksCsv';
import { FetchedClimbingTick } from '../getMyTicks';

const tick = (overrides: Partial<FetchedClimbingTick>): FetchedClimbingTick =>
  ({
    key: 'k1',
    name: 'Route "A"',
    grade: '7a',
    cragName: 'Main Crag',
    cragOsmType: null,
    cragOsmId: null,
    areaName: 'Area, North',
    areaOsmType: null,
    areaOsmId: null,
    center: [14.123, 50.456],
    index: 0,
    date: '2026-08-20',
    style: 'RP',
    apiId: { type: 'way', id: 1 },
    tags: {},
    tick: { shortId: 'w1', routeLon: null, routeLat: null } as any,
    tickScore: { points: 42, gradeRowIndex: 0, gradeBase: 0, multiplier: 1 },
    ...overrides,
  }) as FetchedClimbingTick;

describe('buildTicksCsv', () => {
  test('exports CSV with escaped values and header', () => {
    const csv = buildTicksCsv([tick({})]);
    expect(csv).toContain(
      'date,route_name,grade,style,points,crag,area,route_short_id,route_lon,route_lat',
    );
    expect(csv).toContain('"2026-08-20","Route ""A""","7a","RP","42"');
    expect(csv).toContain('"Main Crag","Area, North","w1","14.123","50.456"');
    expect(csv.endsWith('\n')).toBe(true);
  });

  test('uses route coordinates from tick when present', () => {
    const csv = buildTicksCsv([
      tick({
        tick: { shortId: 'r2', routeLon: 15.2, routeLat: 49.9 } as any,
      }),
    ]);
    expect(csv).toContain('"r2","15.2","49.9"');
  });
});

describe('buildTicksCsvFilename', () => {
  test('sanitizes display name and appends date', () => {
    const filename = buildTicksCsvFilename(
      'John Doe/č',
      new Date(2026, 8, 3, 12, 0, 0),
    );
    expect(filename).toBe('openclimbing-ticks-John-Doe__-2026-09-03.csv');
  });
});

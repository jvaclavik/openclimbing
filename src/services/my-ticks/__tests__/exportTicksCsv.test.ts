import {
  buildTicksCsv,
  buildTicksCsvFilename,
} from '../exportTicksCsv';
import { ClimbingTick } from '../../../types';

const tick = (overrides: Partial<ClimbingTick>): ClimbingTick =>
  ({
    id: 1,
    osmUserId: 11,
    shortId: 'w1',
    timestamp: '2026-08-20',
    style: 'RP',
    myGrade: '7a+',
    note: 'Great day',
    pairing: null,
    routeName: 'Route "A"',
    routeGradeTxt: '7a',
    routeCragName: 'Main Crag',
    routeCragOsmType: null,
    routeCragOsmId: null,
    routeAreaName: 'Area, North',
    routeAreaOsmType: null,
    routeAreaOsmId: null,
    routeLon: 14.123,
    routeLat: 50.456,
    ...overrides,
  });

describe('buildTicksCsv', () => {
  test('exports all canonical tick fields with escaped values and header', () => {
    const csv = buildTicksCsv([tick({})]);
    expect(csv).toContain(
      'date,route_name,route_grade,grade_system,my_grade,style,note,crag,area,route_short_id,route_lon,route_lat',
    );
    expect(csv).toContain(
      '"2026-08-20","Route ""A""","7a","original","7a+","RP","Great day"',
    );
    expect(csv).toContain('"Main Crag","Area, North","w1","14.123","50.456"');
    expect(csv.endsWith('\n')).toBe(true);
  });

  test('includes orphan ticks (without shortId) in export', () => {
    const csv = buildTicksCsv([
      tick({
        shortId: null,
        routeName: 'Orphan',
        routeLon: null,
        routeLat: null,
      }),
    ]);
    expect(csv).toContain('"Orphan"');
    expect(csv).toContain('"Area, North","","",""');
  });

  test('neutralizes dangerous formula prefixes in string fields only', () => {
    const csv = buildTicksCsv([
      tick({
        routeName: '=HYPERLINK("x")',
        routeCragName: '+SUM(1,2)',
        routeAreaName: '@A1',
        note: '-unsafe note',
        routeLon: -15.2,
        routeLat: -49.9,
      }),
    ]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"\'+SUM(1,2)"');
    expect(csv).toContain('"\'@A1"');
    expect(csv).toContain('"\'-unsafe note"');
    expect(csv).toContain('"-15.2","-49.9"');
    expect(csv).not.toContain('"\'-15.2"');
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

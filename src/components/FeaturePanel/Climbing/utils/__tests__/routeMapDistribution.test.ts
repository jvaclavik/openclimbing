import { distance } from '@turf/turf';
import { LonLat } from '../../../../../services/types';
import {
  clusterGroupedRoutes,
  DIRECTED_PITCH_SPACING_M,
  distributeAlongControlPoints,
  distributeGroupedRoutes,
  formatGuideSpacingM,
  guideLineSpacingM,
  hasFollowingPitch,
  isMultipitchAnchor,
  layoutMultipitchGroup,
  parseMultipitchName,
  STACKED_PITCH_SPACING_M,
} from '../routeMapDistribution';

const meters = (a: LonLat, b: LonLat) =>
  distance(a, b, { units: 'kilometers' }) * 1000;

const line: LonLat[] = [
  [0, 0],
  [0, 0.02],
];

const routes = [
  { name: 'Verdes venenos L1' },
  { name: 'Verdes venenos L2' },
  { name: 'Hierbas letales L1' },
  { name: 'Hierbas letales L2' },
  { name: 'Pandemia letal L3' },
  { name: 'Pandemia letal L1' },
  { name: 'Pandemia letal L2' },
];

describe('parseMultipitchName', () => {
  it('reads a trailing pitch number', () => {
    expect(parseMultipitchName('Verdes venenos L1')).toEqual({
      base: 'Verdes venenos',
      pitch: 1,
    });
    expect(parseMultipitchName('Pandemia letal L3')).toEqual({
      base: 'Pandemia letal',
      pitch: 3,
    });
  });

  it('ignores names that are not a multi-pitch suffix', () => {
    expect(parseMultipitchName('Sola')).toBeNull();
    expect(parseMultipitchName('L1')).toBeNull();
    expect(parseMultipitchName('Ruta L1 bis')).toBeNull();
  });
});

describe('distributeGroupedRoutes', () => {
  it('puts every pitch of a route on one slot and stacks them', () => {
    const grouped = distributeGroupedRoutes(line, routes, {
      group: true,
      bearing: null,
    });
    const anchors = distributeAlongControlPoints(line, 3);

    expect(grouped[0]).toEqual(anchors[0]);
    expect(meters(grouped[0], grouped[1])).toBeCloseTo(
      STACKED_PITCH_SPACING_M,
      0,
    );

    expect(grouped[2]).toEqual(anchors[1]);
    expect(meters(grouped[2], grouped[3])).toBeCloseTo(
      STACKED_PITCH_SPACING_M,
      0,
    );

    // L1 sits on the slot even when the list starts at L3
    expect(grouped[5]).toEqual(anchors[2]);
    expect(meters(grouped[5], grouped[6])).toBeCloseTo(
      STACKED_PITCH_SPACING_M,
      0,
    );
    expect(meters(grouped[5], grouped[4])).toBeCloseTo(
      STACKED_PITCH_SPACING_M * 2,
      0,
    );
  });

  it('offsets pitches along the chosen direction', () => {
    const grouped = distributeGroupedRoutes(line, routes, {
      group: true,
      bearing: 90,
    });

    expect(grouped[1][0]).toBeGreaterThan(grouped[0][0]);
    expect(meters(grouped[0], grouped[1])).toBeCloseTo(
      DIRECTED_PITCH_SPACING_M,
      0,
    );
    expect(meters(grouped[5], grouped[4])).toBeCloseTo(
      DIRECTED_PITCH_SPACING_M * 2,
      0,
    );
  });

  it('uses a custom pitch spacing along the chosen direction', () => {
    const grouped = distributeGroupedRoutes(line, routes, {
      group: true,
      bearing: 90,
      spacingM: 15,
    });

    expect(meters(grouped[0], grouped[1])).toBeCloseTo(15, 0);
    expect(meters(grouped[5], grouped[4])).toBeCloseTo(30, 0);
  });

  it('keeps a per-route direction when the global bearing differs', () => {
    const grouped = distributeGroupedRoutes(line, routes, {
      group: true,
      bearing: 0,
      spacingM: 10,
      groupBearings: { 'verdes venenos': { 1: 90 } },
    });

    expect(grouped[1][0]).toBeGreaterThan(grouped[0][0]);
    expect(meters(grouped[0], grouped[1])).toBeCloseTo(10, 0);
    expect((grouped[3] as LonLat)[1]).toBeGreaterThan(grouped[2][1]);
  });

  it('groups only the route that has its own direction when grouping is off', () => {
    const grouped = distributeGroupedRoutes(line, routes, {
      group: false,
      bearing: null,
      spacingM: 12,
      groupBearings: { 'pandemia letal': { 1: 90 } },
    });
    const anchors = distributeAlongControlPoints(line, 5);

    expect(grouped[0]).toEqual(anchors[0]);
    expect(grouped[1]).toEqual(anchors[1]);
    expect(grouped[5]).toEqual(anchors[4]);
    expect(meters(grouped[5], grouped[6])).toBeCloseTo(12, 0);
  });

  it('keeps one slot per route when grouping is off', () => {
    const grouped = distributeGroupedRoutes(line, routes, {
      group: false,
      bearing: 90,
    });
    expect(grouped).toEqual(distributeAlongControlPoints(line, routes.length));
  });
});

describe('guideLineSpacingM', () => {
  it('returns the even gap between slots', () => {
    const points: LonLat[] = [
      [0, 0],
      [0, 0.001],
    ];
    const spacing = guideLineSpacingM(points, 3);
    expect(spacing).toBeCloseTo(meters(points[0], points[1]) / 2, 1);
    expect(guideLineSpacingM(points, 1)).toBeNull();
    expect(formatGuideSpacingM(6.24)).toBe('6.2');
    expect(formatGuideSpacingM(12.6)).toBe('13');
  });
});

describe('layoutMultipitchGroup', () => {
  it('moves only the chosen route off its first pitch', () => {
    const verdes: LonLat = [14.5, 49.5];
    const hierbas: LonLat = [14.2, 49.2];
    const names = [
      { name: 'Verdes venenos L1' },
      { name: 'Verdes venenos L2' },
      { name: 'Hierbas letales L1' },
      { name: 'Hierbas letales L2' },
    ];
    const next = layoutMultipitchGroup(
      names,
      [verdes, [14.6, 49.6], hierbas, [14.3, 49.3]],
      'verdes venenos',
      1,
      90,
      15,
    );

    expect(next[0]).toEqual(verdes);
    expect(next[2]).toEqual(hierbas);
    expect(next[3]).toEqual([14.3, 49.3]);
    expect(meters(verdes, next[1] as LonLat)).toBeCloseTo(15, 0);
    expect(isMultipitchAnchor(names, 0)).toBe(true);
    expect(isMultipitchAnchor(names, 1)).toBe(false);
    expect(hasFollowingPitch(names, 0)).toBe(true);
    expect(hasFollowingPitch(names, 1)).toBe(false);
  });

  it('moves only pitches after the one whose direction was set', () => {
    const pitches: LonLat[] = [
      [14.5, 49.5],
      [14.51, 49.5],
      [14.52, 49.5],
      [14.53, 49.5],
      [14.54, 49.5],
    ];
    const names = [1, 2, 3, 4, 5].map((pitch) => ({
      name: `Alpha L${pitch}`,
    }));
    const next = layoutMultipitchGroup(names, pitches, 'alpha', 4, 0, 10);

    expect(next[0]).toEqual(pitches[0]);
    expect(next[1]).toEqual(pitches[1]);
    expect(next[2]).toEqual(pitches[2]);
    expect(next[3]).toEqual(pitches[3]);
    expect((next[4] as LonLat)[1]).toBeGreaterThan(pitches[3][1]);
    expect(meters(pitches[3], next[4] as LonLat)).toBeCloseTo(10, 0);
    expect(hasFollowingPitch(names, 3)).toBe(true);
    expect(hasFollowingPitch(names, 4)).toBe(false);
  });

  it('keeps a later pitch direction when an earlier one is set', () => {
    const origin: LonLat = [14.5, 49.5];
    const names = [1, 2, 3, 4, 5].map((pitch) => ({
      name: `Alpha L${pitch}`,
    }));
    const next = layoutMultipitchGroup(
      names,
      [origin, origin, origin, origin, origin],
      'alpha',
      1,
      90,
      10,
      { 4: 0 },
    );

    expect(next[0]).toEqual(origin);
    expect(meters(origin, next[3] as LonLat)).toBeCloseTo(30, 0);
    expect((next[3] as LonLat)[0]).toBeGreaterThan(origin[0]);
    expect((next[4] as LonLat)[1]).toBeGreaterThan((next[3] as LonLat)[1]);
    expect(meters(next[3] as LonLat, next[4] as LonLat)).toBeCloseTo(10, 0);
  });
});

describe('clusterGroupedRoutes', () => {
  it('stacks later pitches onto the first one', () => {
    const l1: LonLat = [14.5, 49.5];
    const far: LonLat = [14.51, 49.51];
    const solo: LonLat = [14.2, 49.2];
    const next = clusterGroupedRoutes(
      [
        { name: 'Verdes venenos L1' },
        { name: 'verdes venenos L2' },
        { name: 'Sola' },
      ],
      [l1, far, solo],
      null,
    );

    expect(next[0]).toEqual(l1);
    expect(next[2]).toEqual(solo);
    expect(meters(next[0] as LonLat, next[1] as LonLat)).toBeCloseTo(
      STACKED_PITCH_SPACING_M,
      0,
    );
  });

  it('lines pitches up in the chosen direction from the first pitch', () => {
    const l1: LonLat = [14.5, 49.5];
    const next = clusterGroupedRoutes(
      [
        { name: 'Pandemia letal L1' },
        { name: 'Pandemia letal L2' },
        { name: 'Pandemia letal L3' },
      ],
      [l1, [14.6, 49.6], [14.7, 49.7]],
      0,
    );

    expect(next[0]).toEqual(l1);
    expect((next[1] as LonLat)[1]).toBeGreaterThan(l1[1]);
    expect(meters(l1, next[2] as LonLat)).toBeCloseTo(
      DIRECTED_PITCH_SPACING_M * 2,
      0,
    );
  });
});

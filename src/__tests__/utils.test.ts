import { isClimbingCragLike, isFeatureClimbingRoute } from '../utils';

const hexe = {
  climbing: 'crag',
  'climbing:grade:saxon:min': 'III',
  'climbing:rock': 'sandstone',
  'climbing:summit_log': 'yes',
  'climbing:trad': 'yes',
  name: 'Hexe',
  natural: 'peak',
  sport: 'climbing',
};

const winkelturm = {
  'climbing:grade:saxon:min': 'II',
  'climbing:rock': 'sandstone',
  'climbing:summit_log': 'yes',
  'climbing:trad': 'yes',
  name: 'Winkelturm',
  natural: 'peak',
  sport: 'climbing',
};

describe('isClimbingCragLike', () => {
  it('treats a tagged climbing crag as a crag', () => {
    expect(isClimbingCragLike(hexe)).toBe(true);
  });

  it('treats a climbing peak without climbing=crag as a destination card', () => {
    expect(isClimbingCragLike(winkelturm)).toBe(true);
  });

  it('does not treat a peak without climbing tags as a crag', () => {
    expect(isClimbingCragLike({ natural: 'peak', name: 'Sněžka' })).toBe(false);
  });

  it('treats a cliff access node tagged as route_bottom as a destination', () => {
    expect(
      isClimbingCragLike({
        climbing: 'route_bottom',
        'climbing:grade:saxon:min': 'IV*',
        'climbing:rock': 'sandstone',
        'climbing:summit_log': 'yes',
        'climbing:trad': 'yes',
        name: 'Großer Zschirnstein Südwand',
        natural: 'cliff',
        note: 'Klettereinstieg',
        sport: 'climbing',
      }),
    ).toBe(true);
  });

  it('does not treat a plain route or area as a destination card', () => {
    expect(isClimbingCragLike({ climbing: 'route', name: 'Lída' })).toBe(false);
    expect(isClimbingCragLike({ climbing: 'area', natural: 'peak' })).toBe(
      false,
    );
  });

  it('treats a boulder stone with climbing tags as a destination', () => {
    expect(isClimbingCragLike({ climbing: 'boulder' })).toBe(true);
    expect(
      isClimbingCragLike({
        'climbing:boulder': 'yes',
        name: 'Kidsblock',
        natural: 'stone',
        sport: 'climbing',
      }),
    ).toBe(true);
  });

  it('does not treat parking without climbing tags as a destination', () => {
    expect(isClimbingCragLike({ amenity: 'parking', name: 'P' })).toBe(false);
  });
});

describe('isFeatureClimbingRoute', () => {
  it('treats a normal route_bottom as a route', () => {
    expect(
      isFeatureClimbingRoute({
        tags: { climbing: 'route_bottom', name: 'Lída' },
      } as any),
    ).toBe(true);
  });

  it('does not treat a cliff access node as a route', () => {
    expect(
      isFeatureClimbingRoute({
        tags: {
          climbing: 'route_bottom',
          natural: 'cliff',
          sport: 'climbing',
          name: 'Großer Zschirnstein Südwand',
        },
      } as any),
    ).toBe(false);
  });
});

import {
  colorFromName,
  GeojsonParseError,
  getSafeHttpUrl,
  getUserGeojsonColor,
  parseGeojsonPoints,
} from '../userGeojson';

const collection = (features: unknown[]) =>
  JSON.stringify({ type: 'FeatureCollection', features });

const errorCodeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof GeojsonParseError ? error.code : error;
  }
  return undefined;
};

describe('parseGeojsonPoints', () => {
  it('keeps point features with their properties', () => {
    const result = parseGeojsonPoints(
      collection([
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [14.4, 50.08] },
          properties: { name: 'Crag', link: 'https://example.org/crag' },
        },
      ]),
    );

    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [14.4, 50.08] },
          properties: { name: 'Crag', link: 'https://example.org/crag' },
        },
      ],
    });
  });

  it('splits MultiPoint into single points sharing the properties', () => {
    const result = parseGeojsonPoints(
      collection([
        {
          type: 'Feature',
          geometry: {
            type: 'MultiPoint',
            coordinates: [
              [1, 2],
              [3, 4],
            ],
          },
          properties: { name: 'Pair' },
        },
      ]),
    );

    expect(result.features.map((f) => f.geometry.coordinates)).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(result.features[1].properties).toEqual({ name: 'Pair' });
  });

  it('skips lines and polygons', () => {
    const result = parseGeojsonPoints(
      collection([
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [1, 2],
              [3, 4],
            ],
          },
          properties: { name: 'Line' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [5, 6] },
          properties: { name: 'Point' },
        },
      ]),
    );

    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.name).toBe('Point');
  });

  it('drops nested object properties and invalid coordinates', () => {
    const result = parseGeojsonPoints(
      collection([
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [200, 0] },
          properties: { name: 'Out of range' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [1, 2] },
          properties: { name: 'Ok', nested: { a: 1 }, grade: 6 },
        },
      ]),
    );

    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties).toEqual({ name: 'Ok', grade: 6 });
  });

  it('accepts a single Feature and a bare Point', () => {
    const feature = parseGeojsonPoints(
      JSON.stringify({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [1, 2] },
        properties: { name: 'Single' },
      }),
    );
    const bare = parseGeojsonPoints(
      JSON.stringify({ type: 'Point', coordinates: [3, 4] }),
    );

    expect(feature.features).toHaveLength(1);
    expect(bare.features[0].geometry.coordinates).toEqual([3, 4]);
  });

  it('throws "invalid" for broken JSON and unknown documents', () => {
    expect(errorCodeOf(() => parseGeojsonPoints('{not json'))).toBe('invalid');
    expect(errorCodeOf(() => parseGeojsonPoints('[1, 2]'))).toBe('invalid');
    expect(
      errorCodeOf(() =>
        parseGeojsonPoints(JSON.stringify({ type: 'Topology' })),
      ),
    ).toBe('invalid');
  });

  it('throws "no_points" when there is no point geometry', () => {
    const polygon = collection([
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        },
        properties: {},
      },
    ]);

    expect(errorCodeOf(() => parseGeojsonPoints(polygon))).toBe('no_points');
  });
});

describe('getSafeHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(getSafeHttpUrl('https://example.org/a?b=1')).toBe(
      'https://example.org/a?b=1',
    );
    expect(getSafeHttpUrl('http://example.org')).toBe('http://example.org/');
  });

  it('rejects other schemes, relative and non-string values', () => {
    expect(getSafeHttpUrl('javascript:alert(1)')).toBeUndefined();
    expect(getSafeHttpUrl('data:text/html,hi')).toBeUndefined();
    expect(getSafeHttpUrl('/relative')).toBeUndefined();
    expect(getSafeHttpUrl(42)).toBeUndefined();
    expect(getSafeHttpUrl(undefined)).toBeUndefined();
  });
});

describe('colorFromName', () => {
  it('returns the same hex color for the same name', () => {
    expect(colorFromName('Krkonoše crags')).toBe(
      colorFromName('Krkonoše crags'),
    );
  });

  it('returns a 6-digit hex color', () => {
    expect(colorFromName('anything')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('gives different names different colors', () => {
    const names = ['Crags', 'Ferrata', 'Boulders', 'Gyms', 'Areas', 'Routes'];
    const colors = new Set(names.map(colorFromName));
    expect(colors.size).toBe(names.length);
  });
});

describe('getUserGeojsonColor', () => {
  const data = { type: 'FeatureCollection' as const, features: [] };

  it('uses the stored color when set', () => {
    expect(
      getUserGeojsonColor({ id: '1', name: 'A', color: '#123456', data }),
    ).toBe('#123456');
  });

  it('falls back to the name-based color', () => {
    expect(getUserGeojsonColor({ id: '1', name: 'A', data })).toBe(
      colorFromName('A'),
    );
  });
});

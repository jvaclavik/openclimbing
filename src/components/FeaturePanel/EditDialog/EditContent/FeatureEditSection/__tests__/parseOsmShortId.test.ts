import { parseOsmShortId } from '../parseOsmShortId';

describe('parseOsmShortId', () => {
  it('keeps an existing short id', () => {
    expect(parseOsmShortId('r19074317')).toBe('r19074317');
    expect(parseOsmShortId('N12')).toBe('n12');
  });

  it('parses openclimbing and osm.org URLs', () => {
    expect(parseOsmShortId('https://openclimbing.org/relation/19074317')).toBe(
      'r19074317',
    );
    expect(parseOsmShortId('https://openclimbing.org/cs/way/55')).toBe('w55');
    expect(
      parseOsmShortId(
        'https://www.openstreetmap.org/node/123#map=19/50.0/14.0',
      ),
    ).toBe('n123');
    expect(parseOsmShortId('https://osm.org/relation/9')).toBe('r9');
  });

  it('parses a bare path', () => {
    expect(parseOsmShortId('relation/19074317')).toBe('r19074317');
  });

  it('returns null for junk', () => {
    expect(parseOsmShortId('hello')).toBeNull();
    expect(parseOsmShortId('https://example.com/foo')).toBeNull();
  });
});

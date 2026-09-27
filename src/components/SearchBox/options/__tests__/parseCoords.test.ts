import { parseCoords } from '../parseCoords';

const getCenters = (inputValue: string) =>
  parseCoords(inputValue).map(({ center }) => center);

const expectCloseTo = (inputValue: string, [lon, lat]: [number, number]) => {
  const centers = getCenters(inputValue);
  expect(centers).toHaveLength(1);
  expect(centers[0][0]).toBeCloseTo(lon, 6);
  expect(centers[0][1]).toBeCloseTo(lat, 6);
};

describe('parseCoords', () => {
  describe('decimal degrees', () => {
    it('parses a plain pair used by theCrag or osm.org', () => {
      expect(getCenters('47.32599, 15.38083')).toEqual([
        [15.38083, 47.32599],
        [47.32599, 15.38083], // swapped, in case the input was lon/lat
      ]);
    });

    it('accepts space or semicolon as a separator and ignores surrounding spaces', () => {
      expect(getCenters(' 47.32599 15.38083 ')[0]).toEqual([
        15.38083, 47.32599,
      ]);
      expect(getCenters('47.32599;15.38083')[0]).toEqual([15.38083, 47.32599]);
    });

    it('parses the degree sign', () => {
      expect(getCenters('47.32599° 15.38083°')[0]).toEqual([
        15.38083, 47.32599,
      ]);
      expect(getCenters('47.32599°, 15.38083°')[0]).toEqual([
        15.38083, 47.32599,
      ]);
    });

    it('parses decimal comma', () => {
      expect(getCenters('47,32599 15,38083')[0]).toEqual([15.38083, 47.32599]);
      expect(getCenters('47,32599, 15,38083')[0]).toEqual([15.38083, 47.32599]);
    });

    it('offers only the valid interpretation of a negative pair', () => {
      expect(getCenters('-33.83544, 151.27469')).toEqual([
        [151.27469, -33.83544],
      ]);
    });
  });

  describe('hemisphere', () => {
    it('parses WGS84 degrees with a hemisphere suffix', () => {
      expect(getCenters('49.8167208N, 15.7653808E')).toEqual([
        [15.7653808, 49.8167208],
      ]);
    });

    it('keeps the order given by the hemispheres', () => {
      expect(getCenters('15.7653808E, 49.8167208N')).toEqual([
        [15.7653808, 49.8167208],
      ]);
    });

    it('makes south and west negative', () => {
      expect(getCenters('S 33.83544, W 151.27469')).toEqual([
        [-151.27469, -33.83544],
      ]);
    });

    it('infers the axis of the other half', () => {
      expect(getCenters('49.8167208N 15.7653808')).toEqual([
        [15.7653808, 49.8167208],
      ]);
      expect(getCenters('15.7653808 49.8167208N')).toEqual([
        [15.7653808, 49.8167208],
      ]);
    });
  });

  describe('degrees, minutes and seconds', () => {
    it('parses degrees and decimal minutes', () => {
      expectCloseTo("N 49°49.00325', E 15°45.92285'", [15.7653808, 49.8167208]);
    });

    it('parses degrees, minutes and seconds', () => {
      expectCloseTo(
        '49°49\'0.195"N, 15°45\'55.371"E',
        [15.7653808, 49.8167208],
      );
      expectCloseTo(
        '49° 49\' 0.195" N, 15° 45\' 55.371" E',
        [15.7653808, 49.8167208],
      );
    });

    it('accepts a decimal comma and typographic quotes', () => {
      expectCloseTo('49°49′0,195″N, 15°45′55,371″E', [15.7653808, 49.8167208]);
    });
  });

  describe('grid codes', () => {
    it('parses OpenLocationCode', () => {
      expectCloseTo('8FXQRQ88+M5', [15.7654375, 49.8166875]);
      expect(parseCoords('8FXQRQ88+M5')[0].format).toBe('OpenLocationCode');
    });

    it('parses MGRS', () => {
      expectCloseTo('33UWR55061853', [15.7654424, 49.8167278]);
      expect(parseCoords('33UWR55061853')[0].format).toBe('MGRS');
    });

    it('parses MGRS written with spaces and in lowercase', () => {
      expectCloseTo('33U WR 5506 1853', [15.7654424, 49.8167278]);
      expectCloseTo('33uwr55061853', [15.7654424, 49.8167278]);
    });
  });

  it.each([
    [''],
    ['Pilsen'],
    ['node 123'], // osm object
    ['123456'], // osm id
    ['12/34/56'], // tile
    ['47.32599 15.38083 crag'], // coords must be the whole query
    ['200, 300'], // out of range
    ['49.8167208N, 15.7653808N'], // two latitudes
    ['-49.8167208N, 15.7653808E'], // sign and hemisphere
    ["49°60.5', 15°45'"], // 60 minutes
    ["49.5°30', 15°45'"], // decimal degrees with minutes
  ])('returns nothing for %s', (inputValue) => {
    expect(parseCoords(inputValue)).toEqual([]);
  });
});

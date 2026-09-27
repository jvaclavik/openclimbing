jest.mock('../../../../services/intl', () => ({ t: (key: string) => key }));
jest.mock('dice-coefficient', () => ({ diceCoefficient: () => 0 })); // esm-only module, imported by SearchBox/utils

import { getCoordsOption } from '../coords';

const getCenters = (inputValue: string) =>
  getCoordsOption(inputValue).map(({ coords }) => coords.center);

describe('getCoordsOption', () => {
  it('parses plain lat/lon pairs used by theCrag or osm.org', () => {
    expect(getCenters('47.32599, 15.38083')).toEqual([
      [15.38083, 47.32599],
      [47.32599, 15.38083], // swapped, in case the input was lon/lat
    ]);
  });

  it('accepts space or semicolon as a separator and ignores surrounding spaces', () => {
    expect(getCenters(' 47.32599 15.38083 ')[0]).toEqual([15.38083, 47.32599]);
    expect(getCenters('47.32599;15.38083')[0]).toEqual([15.38083, 47.32599]);
  });

  it('keeps parsing the degree format', () => {
    expect(getCenters('47.32599° 15.38083°')[0]).toEqual([15.38083, 47.32599]);
    expect(getCenters('47.32599°, 15.38083°')[0]).toEqual([15.38083, 47.32599]);
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

  it('adds a label and a subtitle', () => {
    expect(getCoordsOption('47.32599, 15.38083')[0]).toEqual({
      type: 'coords',
      coords: {
        center: [15.38083, 47.32599],
        label: '47.32599° 15.38083°',
        sublabel: 'searchbox.coordinate_subtitle',
      },
    });
  });

  it('keeps parsing OpenLocationCode', () => {
    const [{ coords }] = getCoordsOption('8FVQ89GJ+98');
    expect(coords.center[0]).toBeCloseTo(15.38075, 5);
    expect(coords.center[1]).toBeCloseTo(47.325875, 5);
    expect(coords.label).toBe('8FVQ89GJ+98');
    expect(coords.sublabel).toBe('OpenLocationCode');
  });

  it.each([
    ['Pilsen'],
    ['node 123'], // osm object
    ['123456'], // osm id
    ['12/34/56'], // tile
    ['47.32599 15.38083 crag'], // coords must be the whole query
    ['200, 300'], // out of range
  ])('returns no option for %s', (inputValue) => {
    expect(getCoordsOption(inputValue)).toEqual([]);
  });
});

jest.mock('../../../../services/intl', () => ({ t: (key: string) => key }));
jest.mock('dice-coefficient', () => ({ diceCoefficient: () => 0 })); // esm-only module, imported by SearchBox/utils

import { getCoordsOption } from '../coords';

describe('getCoordsOption', () => {
  it('adds a label and a subtitle', () => {
    expect(getCoordsOption('47.32599, 15.38083')).toEqual([
      {
        type: 'coords',
        coords: {
          center: [15.38083, 47.32599],
          label: '47.32599° 15.38083°',
          sublabel: 'searchbox.coordinate_subtitle',
        },
      },
      {
        type: 'coords',
        coords: {
          center: [47.32599, 15.38083], // swapped, in case the input was lon/lat
          label: '15.38083° 47.32599°',
          sublabel: 'searchbox.coordinate_subtitle',
        },
      },
    ]);
  });

  it('shows the decoded position of a degrees, minutes, seconds query', () => {
    const [{ coords }] = getCoordsOption('49°49\'0.195"N, 15°45\'55.371"E');
    expect(coords.label).toBe('49.81672° 15.76538°');
  });

  it.each([
    ['8FXQRQ88+M5', '49.81669° 15.76544°', 'OpenLocationCode'],
    ['33UWR55061853', '49.81673° 15.76544°', 'MGRS'],
  ])('names the format of %s', (inputValue, label, sublabel) => {
    expect(getCoordsOption(inputValue)[0].coords).toMatchObject({
      label,
      sublabel,
    });
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

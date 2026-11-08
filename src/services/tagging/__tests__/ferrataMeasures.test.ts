import {
  FERRATA_ELE_MAX_M,
  FERRATA_LENGTH_MAX_M,
  matchesFerrataMeasures,
} from '../ferrataMeasures';

const open = {
  lengthInterval: [0, FERRATA_LENGTH_MAX_M] as [number, number],
  spanInterval: [0, 1000] as [number, number],
  eleInterval: [0, FERRATA_ELE_MAX_M] as [number, number],
  lengthDefault: true,
  spanDefault: true,
  eleDefault: true,
};

const measured = { lengthM: 320, spanM: 180, eleM: 1400 };

describe('matchesFerrataMeasures', () => {
  it('keeps every route while the sliders are untouched', () => {
    expect(matchesFerrataMeasures(undefined, open)).toBe(true);
    expect(matchesFerrataMeasures(measured, open)).toBe(true);
  });

  it('filters by route length and still shows routes without a measurement', () => {
    const filter = {
      ...open,
      lengthDefault: false,
      lengthInterval: [200, 500] as [number, number],
    };
    expect(matchesFerrataMeasures(measured, filter)).toBe(true);
    expect(matchesFerrataMeasures({ ...measured, lengthM: 80 }, filter)).toBe(
      false,
    );
    expect(matchesFerrataMeasures(undefined, filter)).toBe(true);
  });

  it('treats the top of the height slider as no upper limit', () => {
    const filter = {
      ...open,
      eleDefault: false,
      eleInterval: [2000, FERRATA_ELE_MAX_M] as [number, number],
    };
    expect(matchesFerrataMeasures({ ...measured, eleM: 3400 }, filter)).toBe(
      true,
    );
    expect(matchesFerrataMeasures(measured, filter)).toBe(false);
  });
});

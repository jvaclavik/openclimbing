import {
  DEFAULT_LENGTH_INTERVAL,
  effectiveLengthFilterMax,
  lengthOverlapsFilter,
  parseClimbingLengthMeters,
} from '../parseClimbingLength';

describe('parseClimbingLengthMeters', () => {
  it('parses bare metres', () => {
    expect(parseClimbingLengthMeters('15')).toEqual({ min: 15, max: 15 });
    expect(parseClimbingLengthMeters('19.0')).toEqual({ min: 19, max: 19 });
    expect(parseClimbingLengthMeters('2,5')).toEqual({ min: 2.5, max: 2.5 });
  });

  it('parses metre units', () => {
    expect(parseClimbingLengthMeters('15m')).toEqual({ min: 15, max: 15 });
    expect(parseClimbingLengthMeters('20 m')).toEqual({ min: 20, max: 20 });
    expect(parseClimbingLengthMeters('20.00 m')).toEqual({ min: 20, max: 20 });
  });

  it('parses feet', () => {
    expect(parseClimbingLengthMeters("100'")).toEqual({
      min: 30.48,
      max: 30.48,
    });
    expect(parseClimbingLengthMeters('60ft')).toEqual({
      min: 18.288,
      max: 18.288,
    });
    expect(parseClimbingLengthMeters('60 ft')).toEqual({
      min: 18.288,
      max: 18.288,
    });
  });

  it('parses ranges', () => {
    expect(parseClimbingLengthMeters('15-20m')).toEqual({ min: 15, max: 20 });
    expect(parseClimbingLengthMeters('10 – 15')).toEqual({ min: 10, max: 15 });
  });

  it('parses approximate and unit suffixes', () => {
    expect(parseClimbingLengthMeters('30m')).toEqual({ min: 30, max: 30 });
    expect(parseClimbingLengthMeters('~30m')).toEqual({ min: 30, max: 30 });
    expect(parseClimbingLengthMeters('ca. 30 m')).toEqual({
      min: 30,
      max: 30,
    });
  });

  it('returns null for unknown values', () => {
    expect(parseClimbingLengthMeters('?')).toBeNull();
    expect(parseClimbingLengthMeters('0')).toBeNull();
    expect(parseClimbingLengthMeters('')).toBeNull();
    expect(parseClimbingLengthMeters(undefined)).toBeNull();
  });
});

describe('lengthOverlapsFilter', () => {
  it('treats max 100 as uncapped', () => {
    expect(
      lengthOverlapsFilter(
        { min: 150, max: 150 },
        0,
        DEFAULT_LENGTH_INTERVAL[1],
      ),
    ).toBe(true);
    expect(effectiveLengthFilterMax(100)).toBe(Number.POSITIVE_INFINITY);
    expect(lengthOverlapsFilter({ min: 80, max: 80 }, 0, 50)).toBe(false);
  });
});

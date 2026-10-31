import { decodeHistogram, encodeHistogram } from '../histogram';

describe('encodeHistogram', () => {
  it('returns null for undefined', () => {
    expect(encodeHistogram(undefined)).toBeNull();
  });

  it('round-trips values within the Uint8 range', () => {
    const decoded = decodeHistogram(
      encodeHistogram([0, 1, 200, 255]) as string,
    );

    expect(decoded.slice(0, 4)).toEqual([0, 1, 200, 255]);
  });

  it('clamps counts above the Uint8 max value to 255', () => {
    // e.g. the Frankenjura area has 273 routes of a single grade
    const decoded = decodeHistogram(encodeHistogram([273, 300]) as string);

    expect(decoded[0]).toBe(255);
    expect(decoded[1]).toBe(255);
  });
});

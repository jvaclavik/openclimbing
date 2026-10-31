import { decodeHistogram, encodeHistogram } from '../histogram';

const bytes = (encoded: string | null) =>
  Buffer.from(encoded as string, 'base64');

describe('encodeHistogram / decodeHistogram', () => {
  it('returns null for undefined', () => {
    expect(encodeHistogram(undefined)).toBeNull();
  });

  it('round-trips counts within the Uint8 range', () => {
    const decoded = decodeHistogram(
      encodeHistogram([0, 1, 200, 255]) as string,
    );

    expect(decoded.slice(0, 4)).toEqual([0, 1, 200, 255]);
  });

  it('round-trips counts above the Uint8 range', () => {
    expect(decodeHistogram(encodeHistogram([273]) as string)[0]).toBe(273);
    expect(
      decodeHistogram(encodeHistogram([256, 100000]) as string).slice(0, 2),
    ).toEqual([256, 100000]);
  });

  it('keeps the legacy layout (index + one byte) for counts up to 255', () => {
    expect(bytes(encodeHistogram([5, 255]))).toEqual(
      Buffer.from([0, 5, 1, 255]),
    );
  });

  it('adds bytes only for counts that do not fit into one byte', () => {
    expect(bytes(encodeHistogram([1])).length).toBe(2); // index + 1 byte
    expect(bytes(encodeHistogram([255])).length).toBe(2); // index + 1 byte
    expect(bytes(encodeHistogram([256])).length).toBe(3); // index + varint(2)
    expect(bytes(encodeHistogram([273])).length).toBe(3);
    expect(bytes(encodeHistogram([100000])).length).toBe(4); // index + varint(3)
  });

  it('does not choke on the Frankenjura area histogram', () => {
    const histogram = new Array(94).fill(0);
    histogram[24] = 273;

    expect(decodeHistogram(encodeHistogram(histogram) as string)[24]).toBe(273);
  });
});

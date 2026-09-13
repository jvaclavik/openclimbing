import { convertHeicToJpeg, isHeicFile } from '../heic';

const heicToMock = jest.fn();
jest.mock('heic-to', () => ({
  heicTo: (args: unknown) => heicToMock(args),
}));

const makeFile = (name: string, type: string): File =>
  new File([new Uint8Array([1, 2, 3])], name, { type, lastModified: 42 });

describe('isHeicFile', () => {
  it('detects HEIC/HEIF by mime type', () => {
    expect(isHeicFile(makeFile('IMG.jpg', 'image/heic'))).toBe(true);
    expect(isHeicFile(makeFile('IMG.jpg', 'image/heif'))).toBe(true);
    expect(isHeicFile(makeFile('IMG.jpg', 'IMAGE/HEIC'))).toBe(true);
  });

  it('detects HEIC/HEIF by extension when the mime type is missing', () => {
    // Desktop Chrome often reports an empty type for .heic files.
    expect(isHeicFile(makeFile('IMG_1234.HEIC', ''))).toBe(true);
    expect(isHeicFile(makeFile('photo.heif', ''))).toBe(true);
  });

  it('returns false for regular images', () => {
    expect(isHeicFile(makeFile('photo.jpg', 'image/jpeg'))).toBe(false);
    expect(isHeicFile(makeFile('photo.png', 'image/png'))).toBe(false);
  });
});

describe('convertHeicToJpeg', () => {
  beforeEach(() => {
    heicToMock.mockReset();
  });

  it('converts to a JPG file, rewriting the extension and preserving metadata', async () => {
    heicToMock.mockResolvedValue(
      new Blob([new Uint8Array([9, 9])], { type: 'image/jpeg' }),
    );

    const result = await convertHeicToJpeg(makeFile('IMG_1234.HEIC', ''));

    expect(heicToMock).toHaveBeenCalledWith({
      blob: expect.any(File),
      type: 'image/jpeg',
      quality: 0.92,
    });
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('IMG_1234.jpg');
    expect(result.type).toBe('image/jpeg');
    expect(result.lastModified).toBe(42);
  });

  it('surfaces the underlying reason as an Error when conversion fails', async () => {
    // heic-to's worker can reject with a non-Error value.
    heicToMock.mockRejectedValue('ERR_LIBHEIF decode failed');

    await expect(convertHeicToJpeg(makeFile('IMG.heic', ''))).rejects.toThrow(
      'Could not convert HEIC image to JPG: ERR_LIBHEIF decode failed',
    );
  });
});

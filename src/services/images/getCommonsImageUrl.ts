import { md5 } from 'js-md5';
import { encodeUrl } from '../../helpers/utils';

// requests for other widths works, but may be blocked for some users #1463
// from https://www.mediawiki.org/wiki/Common_thumbnail_sizes
export type CommonsAllowedWidth =
  | 20
  | 40
  | 60
  | 120
  | 250
  | 330
  | 500
  | 960
  | 1280
  | 1920
  | 3840;

export const getCommonsImageUrl = (
  photoName: string,
  width: CommonsAllowedWidth | 'original',
): string | null => {
  if (!photoName) {
    return null;
  }

  if (!photoName.startsWith('File:')) {
    console.warn('Invalid Commons photo name without "File:":', photoName); // eslint-disable-line no-console
    return null;
  }

  const fileName = decodeURI(photoName)
    .replace(/^.*File:/, '')
    .replace(/ /g, '_');
  const hash = md5(fileName);
  const part1 = hash[0];
  const part2 = hash.substring(0, 2);

  if (width === 'original') {
    return encodeUrl`https://upload.wikimedia.org/wikipedia/commons/${part1}/${part2}/${fileName}`;
  }

  return encodeUrl`https://upload.wikimedia.org/wikipedia/commons/thumb/${part1}/${part2}/${fileName}/${width}px-${fileName}`;
};

// Wikimedia thumbnail URLs look like `.../thumb/x/xx/Name.jpg/500px-Name.jpg`.
const THUMB_WIDTH_REGEX = /\/(\d+)px-/;

const isWikimediaThumbUrl = (url: string) =>
  !!url && url.includes('upload.wikimedia.org') && url.includes('/thumb/');

// Returns null for anything that is not a Wikimedia thumbnail, so callers can
// fall back to whatever the original provider gave them.
export const resizeWikimediaThumbUrl = (
  url: string,
  width: CommonsAllowedWidth,
): string | null =>
  isWikimediaThumbUrl(url)
    ? url.replace(THUMB_WIDTH_REGEX, `/${width}px-`)
    : null;

// The app fetches small thumbs (WIDTH) for the UI, but for downloads/exports we
// want a sharper source. This bumps the requested width in-place; only upscales
// (never shrinks) and leaves non-Wikimedia URLs untouched.
export const upscaleWikimediaThumbUrl = (
  url: string,
  width: CommonsAllowedWidth,
): string => {
  if (!isWikimediaThumbUrl(url)) {
    return url;
  }
  return url.replace(THUMB_WIDTH_REGEX, (match, current) =>
    Number(current) < width ? `/${width}px-` : match,
  );
};

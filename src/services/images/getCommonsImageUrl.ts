import { md5 } from 'js-md5';
import { encodeUrl } from '../../helpers/utils';
import { OFFLINE_PHOTO_WIDTHS } from '../offline/consts';

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

// When offline we only have the few widths downloaded per photo (see
// OFFLINE_PHOTO_WIDTHS). Snap any requested width up to the nearest available
// one — the app requests device-dependent widths (120, 960, ...) that we don't
// cache, so without this every offline photo would 404. Online, widths pass
// through untouched.
const snapWidthWhenOffline = (
  width: CommonsAllowedWidth,
): CommonsAllowedWidth => {
  if (typeof navigator !== 'undefined' && navigator.onLine) return width;
  if (typeof navigator === 'undefined') return width; // SSR — always "online"
  const sorted = [...OFFLINE_PHOTO_WIDTHS].sort((a, b) => a - b);
  const pick = sorted.find((w) => w >= width) ?? sorted[sorted.length - 1];
  return pick as CommonsAllowedWidth;
};

export const getCommonsImageUrl = (
  photoName: string,
  widthArg: CommonsAllowedWidth | 'original',
): string | null => {
  const width =
    widthArg === 'original' ? widthArg : snapWidthWhenOffline(widthArg);

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

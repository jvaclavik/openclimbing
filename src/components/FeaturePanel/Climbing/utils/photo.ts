import { FeatureTags } from '../../../../services/types';
import { isIOS } from '../../../../helpers/platforms';
import { naturalSort } from './array';

// @TODO move file outside of climbing

export const getWikimediaCommonsKey = (index: number) =>
  `wikimedia_commons${index === 0 ? '' : `:${index + 1}`}`;

export const isWikimediaCommonsFileSlotKey = (key: string) =>
  /^wikimedia_commons(:\d+)?$/.test(key);

export const wikimediaCommonsFileKeyToIndex = (key: string): number => {
  if (key === 'wikimedia_commons') return 0;
  const m = key.match(/^wikimedia_commons:(\d+)$/);
  return m ? parseInt(m[1], 10) - 1 : -1;
};

export const getWikimediaCommonsPathKeyForPhotoIndex = (
  index: number,
): string =>
  index === 0
    ? 'wikimedia_commons:path'
    : `wikimedia_commons:${index + 1}:path`;

export const pathKeyForWikimediaCommonsFileKey = (fileKey: string): string => {
  const index = wikimediaCommonsFileKeyToIndex(fileKey);
  if (index < 0) {
    return 'wikimedia_commons:path';
  }
  return getWikimediaCommonsPathKeyForPhotoIndex(index);
};

export const addFilePrefix = (name: string) => `File:${name}`;

export const removeFilePrefix = (name: string) => name?.replace(/^File:/, '');

// Wikimedia treats spaces and underscores in file titles as equivalent, and
// the imageinfo API returns titles with spaces while OSM tags often use
// underscores. This produces a stable key so a photo coming from an EXIF
// response and the same photo coming from a `wikimedia_commons=*` tag value
// compare equal.
export const photoNameKey = (name: string | undefined): string =>
  removeFilePrefix(name ?? '')
    .replace(/_/g, ' ')
    .trim();

export const isWikimediaCommons = (tag: string) =>
  tag.startsWith('wikimedia_commons');

export const hasWikimediaCommons = (tags: FeatureTags) =>
  Object.keys(tags).some((tag) => isWikimediaCommons(tag));

export const isWikimediaCommonsPhoto = ([key, value]: [string, string]) => {
  // regexp to match wikimedia_commons, wikimedia_commons:2, etc. but not  wikimedia_commons:path, wikimedia_commons:whatever
  const re = /^wikimedia_commons(:\d+)?$/;
  return re.test(key) && value.startsWith('File:');
};

export const getWikimediaCommonsPhotoTags = (tags: FeatureTags) => {
  return naturalSort(
    Object.entries(tags).filter(isWikimediaCommonsPhoto),
    (item) => item[0],
  );
};
export const getWikimediaCommonsPhotoTagsObject = (tags: FeatureTags) => {
  return getWikimediaCommonsPhotoTags(tags).reduce(
    (acc, [tagKey, tagValue]) => ({ ...acc, [tagKey]: tagValue }),
    {},
  );
};

export const getWikimediaCommonsPhotoKeys = (tags: FeatureTags) =>
  getWikimediaCommonsPhotoTags(tags).map(([tagKey, _tagValue]) => tagKey);

export const getWikimediaCommonsPhotoValues = (tags: FeatureTags) =>
  getWikimediaCommonsPhotoTags(tags).map(([_tagKey, tagValue]) => tagValue);

export const isWikimediaCommonsPhotoPath = (tag: string) => {
  const re = /^wikimedia_commons(:\d+)*:path$/;
  return re.test(tag);
};

export const getWikimediaCommonsPhotoPathKeys = (tags: FeatureTags) =>
  Object.keys(tags).filter(isWikimediaCommonsPhotoPath);

// A route is considered "drawn on a photo" when it has at least one
// non-empty `wikimedia_commons[...]:path` tag describing its line on an image.
export const hasPathOnPhoto = (tags: FeatureTags) =>
  getWikimediaCommonsPhotoPathKeys(tags).some((key) =>
    Boolean(tags[key]?.trim()),
  );

// True when this route has a drawn line on the given photo, i.e. it owns a
// `wikimedia_commons[...]` slot whose value is that photo AND the matching
// `…:path` tag is non-empty.
export const isRouteDrawnOnPhoto = (
  tags: FeatureTags,
  photoName: string | null | undefined,
): boolean => {
  if (!photoName) return false;
  const target = photoNameKey(photoName);
  return getWikimediaCommonsPhotoTags(tags).some(([fileKey, value]) => {
    if (photoNameKey(value) !== target) return false;
    const pathKey = pathKeyForWikimediaCommonsFileKey(fileKey);
    return Boolean(tags[pathKey]?.trim());
  });
};

export const getWikimediaCommonsTags = (tags: FeatureTags) => {
  return naturalSort(
    Object.entries(tags).filter(([key]) => {
      return isWikimediaCommons(key);
    }),
    (item) => item[0],
  );
};

export const getWikimediaCommonsKeys = (tags: FeatureTags) =>
  getWikimediaCommonsTags(tags).map(([tagKey, _tagValue]) => tagKey); // TODO this returns also :path keys, not sure if intended

// @deprecated this function must be refactored, in fact it returns "Last Index", but it is hidden inside - see history
export const getNextWikimediaCommonsIndex = (tags: FeatureTags) => {
  const keys = getWikimediaCommonsKeys(tags);

  const maxKey = keys.reduce((max, key) => {
    if (key === 'wikimedia_commons') return Math.max(max, 0);

    const parts = key.split(':');
    if (parts[0] === 'wikimedia_commons' && parts.length > 1) {
      const number = parseInt(parts[1], 10);
      if (!Number.isNaN(number)) {
        return Math.max(max, number - 1);
      }
    }
    return max;
  }, -1 /* so it will be 0 for the first tag*/);

  return maxKey + 1;
};

const getHighestCachedResolution = ({ loadedPhotos, photoPath }) => {
  if (!loadedPhotos || !loadedPhotos?.[photoPath]) return null;

  return Object.keys(loadedPhotos[photoPath])
    .map((key) => Number(key))
    .reduce<number | null>((maxResolution, resolution) => {
      const isLoaded = loadedPhotos[photoPath][resolution];
      if (!maxResolution || (resolution > maxResolution && isLoaded)) {
        return resolution;
      }
      return maxResolution;
    }, null);
};

const getDisplayedPhotoWidth = ({ imageSize, windowDimensions }) => {
  // Prefer the actual rendered image width — it already accounts for the
  // split pane size and for object-fit: contain narrowing portrait photos.
  // Window width is only a fallback used before the first photo has loaded
  // and imageSize is still {0, 0}; we go conservative there so the very
  // first thumbnail isn't wildly oversized for the actual display area.
  if (imageSize?.width > 0) return imageSize.width;
  return (windowDimensions?.width ?? 0) * 0.5;
};

const getResolutionAccordingZoom = ({
  windowDimensions,
  imageSize,
  photoZoom,
}) => {
  const retinaMultiplier = isIOS() ? 2 : 1;
  const ROUND_SIZES_TO = 200;

  const baseWidth = getDisplayedPhotoWidth({ imageSize, windowDimensions });
  // Zoom > 1 means the user wants more detail; <= 1 means the photo is shown
  // smaller than its natural size and we don't gain by fetching anything
  // larger than its rendered width.
  const zoomFactor = Math.max(1, photoZoom?.scale ?? 1);

  const needed = baseWidth * zoomFactor * retinaMultiplier;
  return Math.ceil(needed / ROUND_SIZES_TO) * ROUND_SIZES_TO;
};

export const getResolution = ({
  windowDimensions,
  imageSize,
  photoPath,
  photoZoom,
  loadedPhotos,
}) => {
  const newResolution = getResolutionAccordingZoom({
    windowDimensions,
    imageSize,
    photoZoom,
  });

  const highestCachedResolution = getHighestCachedResolution({
    loadedPhotos,
    photoPath,
  });
  if (
    highestCachedResolution !== null &&
    newResolution < highestCachedResolution
  ) {
    return highestCachedResolution;
  }

  return newResolution;
};

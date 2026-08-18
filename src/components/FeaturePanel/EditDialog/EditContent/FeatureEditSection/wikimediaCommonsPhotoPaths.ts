import { FeatureTags } from '../../../../../services/types';
import { parsePathTag } from '../../../../../services/images/getImageDefs';
import {
  getWikimediaCommonsPhotoTags,
  pathKeyForWikimediaCommonsFileKey,
  photoNameKey,
} from '../../../Climbing/utils/photo';
import { PathWithTags } from '../../../FeatureImages/PathsSvg';

/** Anything that can own a drawn line – an EditContext item or a member feature. */
export type PathSource = { shortId: string; tags: FeatureTags };

const getPath = (tags: FeatureTags, fileKey: string) => {
  const path = parsePathTag(tags[pathKeyForWikimediaCommonsFileKey(fileKey)]);
  return path && path.length > 1 ? path : undefined; // a single point is not a line
};

// All slots of one source pointing at `photoKey`, with their drawn line (if any).
const getPathsOnPhoto = (
  { shortId, tags }: PathSource,
  photoKey: string,
): PathWithTags[] =>
  getWikimediaCommonsPhotoTags(tags)
    .filter(([, value]) => photoNameKey(value) === photoKey)
    .map(([fileKey]) => ({
      key: `${shortId}-${fileKey}`,
      path: getPath(tags, fileKey),
      tags,
    }))
    .filter(({ path }) => path != null);

/**
 * Lines drawn on the photos of `item`, keyed by its `wikimedia_commons*` slot –
 * the item's own `…:path` tag plus the paths its members drew on the same photo.
 */
export const collectPhotoPaths = (
  item: PathSource,
  memberSources: PathSource[],
  fileKeys: string[],
): Record<string, PathWithTags[]> =>
  Object.fromEntries(
    fileKeys.map((fileKey) => {
      const photoKey = photoNameKey(item.tags[fileKey]);
      if (!photoKey) {
        return [fileKey, []];
      }

      const ownPath = getPath(item.tags, fileKey);
      return [
        fileKey,
        [
          ...(ownPath
            ? [
                {
                  key: `${item.shortId}-${fileKey}`,
                  path: ownPath,
                  tags: item.tags,
                },
              ]
            : []),
          ...memberSources.flatMap((source) =>
            getPathsOnPhoto(source, photoKey),
          ),
        ],
      ];
    }),
  );

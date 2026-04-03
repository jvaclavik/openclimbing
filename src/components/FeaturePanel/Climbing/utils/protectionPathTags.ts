import { FeatureTags } from '../../../../services/types';
import { PathPoints } from '../types';
import { getWikimediaCommonsPhotoTags, removeFilePrefix } from './photo';
import { parsePathString, stringifyPath } from './pathUtils';

export const protectionPathKey = (wikimediaFileKey: string) =>
  `${wikimediaFileKey}:protection_path`;

export const parseProtectionPointsByPhoto = (
  tags: FeatureTags,
): Record<string, PathPoints> => {
  const result: Record<string, PathPoints> = {};
  getWikimediaCommonsPhotoTags(tags).forEach(([fileKey, fileValue]) => {
    const photoPathname = removeFilePrefix(fileValue);
    const raw = tags[protectionPathKey(fileKey)];
    const points = parsePathString(raw);
    if (points.length) {
      result[photoPathname] = points;
    }
  });
  return result;
};

export const getCragProtectionTagPatch = (
  cragTags: FeatureTags,
  protectionByPhoto: Record<string, PathPoints>,
): FeatureTags => {
  const patch: FeatureTags = {};
  getWikimediaCommonsPhotoTags(cragTags).forEach(([fileKey, fileValue]) => {
    const photoPathname = removeFilePrefix(fileValue);
    const pts = protectionByPhoto[photoPathname] ?? [];
    const tagKey = protectionPathKey(fileKey);
    const prev = cragTags[tagKey] ?? '';
    const next = pts.length ? stringifyPath(pts) : '';
    if (next && next !== prev) {
      patch[tagKey] = next;
    } else if (!next && prev) {
      patch[tagKey] = '';
    }
  });
  return patch;
};

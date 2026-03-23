import { FeatureTags } from '../../../../../services/types';
import { SetTagsEntries } from '../../context/types';
import {
  getWikimediaCommonsKey,
  getWikimediaCommonsPathKeyForPhotoIndex,
  isWikimediaCommonsFileSlotKey,
  isWikimediaCommonsPhotoPath,
  pathKeyForWikimediaCommonsFileKey,
} from '../../../Climbing/utils/photo';

export type WikimediaPhotoSlot = {
  fileValue: string;
  pathValue?: string;
};

export const slotsFromFileKeysOrder = (
  tags: FeatureTags,
  fileKeys: string[],
): WikimediaPhotoSlot[] =>
  fileKeys.map((k) => ({
    fileValue: tags[k] ?? '',
    pathValue: tags[pathKeyForWikimediaCommonsFileKey(k)] || undefined,
  }));

export const applyWikimediaPhotoSlots = (
  setTagsEntries: SetTagsEntries,
  slots: WikimediaPhotoSlot[],
) => {
  setTagsEntries((prev) => {
    const filtered = prev.filter(([k]) => {
      if (isWikimediaCommonsFileSlotKey(k)) return false;
      if (isWikimediaCommonsPhotoPath(k)) return false;
      return true;
    });
    const additions: [string, string][] = [];
    slots.forEach((slot, i) => {
      additions.push([getWikimediaCommonsKey(i), slot.fileValue]);
      if (slot.pathValue) {
        additions.push([
          getWikimediaCommonsPathKeyForPhotoIndex(i),
          slot.pathValue,
        ]);
      }
    });
    return [...filtered, ...additions];
  });
};

export const remappedFileKeysAfterSlots = (slotCount: number): string[] =>
  Array.from({ length: slotCount }, (_, i) => getWikimediaCommonsKey(i));

export const mergeActiveMajorKeysAfterRemap = (
  prev: string[],
  newFileKeys: string[],
): string[] => {
  const first = prev.findIndex(isWikimediaCommonsFileSlotKey);
  if (first === -1) {
    return [...prev, ...newFileKeys];
  }
  const wikiCount = prev.filter(isWikimediaCommonsFileSlotKey).length;
  return [
    ...prev.slice(0, first),
    ...newFileKeys,
    ...prev.slice(first + wikiCount),
  ];
};

import React, { useEffect } from 'react';
import { useEditDialogUploadContext } from './EditDialogUploadContext';
import { useCurrentItem } from './context/EditContext';
import {
  getNextWikimediaCommonsIndex,
  getWikimediaCommonsKey,
  isWikimediaCommonsFileSlotKey,
} from '../Climbing/utils/photo';
import { UploadPhotoDialog } from './EditContent/FeatureEditSection/UploadPhotoDialog/UploadPhotoDialog';
import { TagsEntries } from './context/types';

/**
 * Mounted once inside EditDialog; lets any descendant request the upload flow
 * (via `openUpload`) without each call site owning its own dialog instance.
 */
export const EditDialogUploadHost: React.FC<{
  activeMajorKeys: string[];
  setActiveMajorKeys: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ setActiveMajorKeys }) => {
  const { uploadRequest, closeUpload } = useEditDialogUploadContext();
  const currentItem = useCurrentItem();
  const uploadedSlotKeys = Object.entries(currentItem?.tags ?? {})
    .filter(
      ([key, value]) => isWikimediaCommonsFileSlotKey(key) && value.trim(),
    )
    .map(([key]) => key);
  const uploadedSlotKeysKey = uploadedSlotKeys.join('\0');

  useEffect(() => {
    const nextUploadedSlotKeys = uploadedSlotKeysKey
      ? uploadedSlotKeysKey.split('\0')
      : [];
    setActiveMajorKeys((prev) => {
      const missingKeys = nextUploadedSlotKeys.filter(
        (key) => !prev.includes(key),
      );
      return missingKeys.length > 0 ? [...prev, ...missingKeys] : prev;
    });
  }, [setActiveMajorKeys, uploadedSlotKeysKey]);

  const handleUploaded = (fileTagValue: string) => {
    if (!currentItem) return;
    const targetKey = uploadRequest?.targetSlotKey;
    currentItem.setTagsEntries((prevEntries: TagsEntries) => {
      const nextEntries = [...prevEntries];
      const prevTags = Object.fromEntries(prevEntries);
      // Use the explicitly requested slot only while it's still empty. In a
      // multi-file batch the first photo fills it; the rest must land in new
      // slots instead of overwriting it.
      const key =
        targetKey && !prevTags[targetKey]?.trim()
          ? targetKey
          : getWikimediaCommonsKey(getNextWikimediaCommonsIndex(prevTags));
      const position = nextEntries.findIndex(
        ([existingKey]) => existingKey === key,
      );
      if (position === -1) {
        nextEntries.push([key, fileTagValue]);
      } else {
        nextEntries[position] = [key, fileTagValue];
      }
      return nextEntries;
    });
  };

  // Some renders (skeleton/loading) may not have a current item yet.
  if (!currentItem) return null;

  return (
    <UploadPhotoDialog
      open={uploadRequest !== null}
      initialFiles={uploadRequest?.initialFiles ?? null}
      onClose={closeUpload}
      onUploaded={handleUploaded}
    />
  );
};

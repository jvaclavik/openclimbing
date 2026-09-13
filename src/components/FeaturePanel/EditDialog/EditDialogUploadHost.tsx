import React from 'react';
import { useEditDialogUploadContext } from './EditDialogUploadContext';
import { useCurrentItem } from './context/EditContext';
import {
  getNextWikimediaCommonsIndex,
  getWikimediaCommonsKey,
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

  // Some renders (skeleton/loading) may not have a current item yet.
  if (!currentItem) return null;

  const { setTagsEntries } = currentItem;

  const handleUploaded = (fileTagValue: string) => {
    const targetKey = uploadRequest?.targetSlotKey;
    let slotKey = '';
    setTagsEntries((prevEntries: TagsEntries) => {
      const nextEntries = [...prevEntries];
      const prevTags = Object.fromEntries(prevEntries);
      // Use the explicitly requested slot only while it's still empty. In a
      // multi-file batch the first photo fills it; the rest must land in new
      // slots instead of overwriting it.
      if (targetKey && !prevTags[targetKey]?.trim()) {
        slotKey = targetKey;
      } else {
        // Pick the next available wikimedia_commons slot key.
        const nextIndex = getNextWikimediaCommonsIndex(prevTags);
        slotKey = getWikimediaCommonsKey(nextIndex);
      }
      const key = slotKey;
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
    // Make sure the new slot is visible in the editor.
    if (setActiveMajorKeys) {
      setActiveMajorKeys((prev) =>
        prev.includes(slotKey) ? prev : [...prev, slotKey],
      );
    }
  };

  return (
    <UploadPhotoDialog
      open={uploadRequest !== null}
      initialFiles={uploadRequest?.initialFiles ?? null}
      onClose={closeUpload}
      onUploaded={handleUploaded}
    />
  );
};

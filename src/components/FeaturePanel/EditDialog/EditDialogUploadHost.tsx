import React from 'react';
import { useEditDialogUploadContext } from './EditDialogUploadContext';
import { useCurrentItem } from './context/EditContext';
import {
  getNextWikimediaCommonsIndex,
  getWikimediaCommonsKey,
} from '../Climbing/utils/photo';
import { UploadPhotoDialog } from './EditContent/FeatureEditSection/UploadPhotoDialog/UploadPhotoDialog';

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

  const { tags, setTag } = currentItem;

  const handleUploaded = (fileTagValue: string) => {
    const targetKey = uploadRequest?.targetSlotKey;
    if (targetKey) {
      setTag(targetKey, fileTagValue);
      return;
    }
    // Pick the next available wikimedia_commons slot key.
    const nextIndex = getNextWikimediaCommonsIndex(tags);
    const slotKey = getWikimediaCommonsKey(nextIndex);
    setTag(slotKey, fileTagValue);
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
      initialFile={uploadRequest?.initialFile ?? null}
      onClose={closeUpload}
      onUploaded={handleUploaded}
    />
  );
};

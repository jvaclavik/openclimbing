import React from 'react';
import { Box, Stack } from '@mui/material';
import { useCurrentItem } from '../../context/EditContext';
import { useEditDialogContext } from '../../../helpers/EditDialogContext';
import { useDragItems } from '../../../../utils/useDragItems';
import { DragHandler } from '../../../../utils/DragHandler';
import { moveElementToIndex } from '../../../Climbing/utils/array';
import {
  applyWikimediaPhotoSlots,
  remappedFileKeysAfterSlots,
  slotsFromFileKeysOrder,
} from './wikimediaCommonsGalleryModel';
import { WikimediaCommonsGalleryRow } from './WikimediaCommonsGalleryRow';

const normalizeWikimediaCommonsInput = (raw: string) =>
  decodeURI(
    raw
      .replace(/^https:\/\/commons\.wikimedia\.org\/wiki\//, '')
      .replaceAll('_', ' '),
  );

type Props = {
  fileKeys: string[];
  onFileKeysChange: (next: string[]) => void;
};

export const WikimediaCommonsGallery: React.FC<Props> = ({
  fileKeys,
  onFileKeysChange,
}) => {
  const { focusTag } = useEditDialogContext();
  const { tags, setTag, setTagsEntries } = useCurrentItem();

  const applySlotsAndSyncKeys = (
    slotList: ReturnType<typeof slotsFromFileKeysOrder>,
  ) => {
    applyWikimediaPhotoSlots(setTagsEntries, slotList);
    onFileKeysChange(remappedFileKeysAfterSlots(slotList.length));
  };

  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    HighlightedDropzone,
    ItemContainer,
    draggedItem,
  } = useDragItems<string>({
    initialItems: fileKeys,
    moveItems: (oldIndex, newIndex) => {
      const slots = slotsFromFileKeysOrder(tags, fileKeys);
      const reordered = moveElementToIndex(slots, oldIndex, newIndex);
      applySlotsAndSyncKeys(reordered);
    },
    direction: 'horizontal',
  });

  const removeRow = (index: number) => {
    const slots = slotsFromFileKeysOrder(tags, fileKeys);
    applySlotsAndSyncKeys(slots.filter((_, i) => i !== index));
  };

  const onValueChange = (fileKey: string, raw: string) => {
    setTag(fileKey, normalizeWikimediaCommonsInput(raw));
  };

  const canReorder = fileKeys.length > 1;

  return (
    <Stack spacing={2} mb={2}>
      {fileKeys.map((fileKey, index) => {
        const value = tags[fileKey] ?? '';

        return (
          <ItemContainer key={fileKey} style={{ width: '100%' }}>
            {canReorder && draggedItem != null && draggedItem.id > index && (
              <HighlightedDropzone index={index} />
            )}
            <Box
              sx={{ position: 'relative', width: 1 }}
              onDragOver={
                canReorder ? (e) => handleDragOver(e, index) : undefined
              }
            >
              <WikimediaCommonsGalleryRow
                fileKey={fileKey}
                index={index}
                value={value}
                focusTag={focusTag}
                onValueChange={onValueChange}
                onRemove={() => removeRow(index)}
                dragHandle={
                  canReorder ? (
                    <DragHandler
                      onDragStart={(e) =>
                        handleDragStart(e, { id: index, content: fileKey })
                      }
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    />
                  ) : undefined
                }
              />
            </Box>
            {canReorder && draggedItem != null && draggedItem.id <= index && (
              <HighlightedDropzone index={index} activeAt={index + 1} />
            )}
          </ItemContainer>
        );
      })}
    </Stack>
  );
};

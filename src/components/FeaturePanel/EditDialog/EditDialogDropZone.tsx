import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { t } from '../../../services/intl';
import { useEditDialogUploadContext } from './EditDialogUploadContext';

const containsFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

const pickImage = (event: DragEvent): File | null => {
  const items = Array.from(event.dataTransfer?.files ?? []);
  return (
    items.find(
      (f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name),
    ) ?? null
  );
};

/**
 * Catches file drops anywhere on the page while the EditDialog is open, then
 * forwards the first image to the upload flow. Document-level listeners are
 * used because MUI Dialog content lives in a portal and React events on the
 * paper can miss drags that start outside the dialog.
 */
export const EditDialogDropZone: React.FC = ({ children }) => {
  const { openUpload } = useEditDialogUploadContext();
  const [draggingOver, setDraggingOver] = useState(false);

  useEffect(() => {
    let depth = 0;

    const onDragEnter = (e: DragEvent) => {
      if (!containsFiles(e)) return;
      e.preventDefault();
      depth += 1;
      setDraggingOver(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!containsFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (e: DragEvent) => {
      if (!containsFiles(e)) return;
      e.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDraggingOver(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!containsFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDraggingOver(false);
      const file = pickImage(e);
      if (file) openUpload({ initialFile: file });
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      setDraggingOver(false);
    };
  }, [openUpload]);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {children}
      {draggingOver && (
        <Box
          aria-hidden
          sx={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            bgcolor: 'rgba(25, 118, 210, 0.18)',
            border: '4px dashed',
            borderColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 2000,
            gap: 1,
          }}
        >
          <CloudUploadOutlined sx={{ fontSize: 80, color: 'primary.main' }} />
          <Typography variant="h6" color="primary">
            {t('uploaddialog.drop_to_upload')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

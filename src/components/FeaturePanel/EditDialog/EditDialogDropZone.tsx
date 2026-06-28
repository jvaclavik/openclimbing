import React, { useEffect, useRef, useState } from 'react';
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
 * Multiple EditDialog instances can be mounted at once (e.g. the FeaturePanel
 * and the climbing crag dialog both render one, driven by the same global
 * "opened" state). Each would otherwise attach its own document-level drop
 * listeners, so a single file drop opened two upload dialogs at once.
 *
 * To avoid that, the window listeners are installed once at module scope and
 * the drop is routed to a single active drop zone — the most recently mounted
 * one, which is the top-most/visible dialog.
 */
type Subscriber = {
  openUpload: (file: File) => void;
  setDraggingOver: (value: boolean) => void;
};

const subscribers: Subscriber[] = [];
let listenersInstalled = false;
let dragDepth = 0;

const activeSubscriber = (): Subscriber | undefined =>
  subscribers[subscribers.length - 1];

const onDragEnter = (e: DragEvent) => {
  if (!containsFiles(e)) return;
  e.preventDefault();
  dragDepth += 1;
  activeSubscriber()?.setDraggingOver(true);
};
const onDragOver = (e: DragEvent) => {
  if (!containsFiles(e)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
};
const onDragLeave = (e: DragEvent) => {
  if (!containsFiles(e)) return;
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) activeSubscriber()?.setDraggingOver(false);
};
const onDrop = (e: DragEvent) => {
  if (!containsFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  const active = activeSubscriber();
  active?.setDraggingOver(false);
  const file = pickImage(e);
  if (file && active) active.openUpload(file);
};

const installListeners = () => {
  if (listenersInstalled) return;
  window.addEventListener('dragenter', onDragEnter);
  window.addEventListener('dragover', onDragOver);
  window.addEventListener('dragleave', onDragLeave);
  window.addEventListener('drop', onDrop);
  listenersInstalled = true;
};
const uninstallListeners = () => {
  if (!listenersInstalled) return;
  window.removeEventListener('dragenter', onDragEnter);
  window.removeEventListener('dragover', onDragOver);
  window.removeEventListener('dragleave', onDragLeave);
  window.removeEventListener('drop', onDrop);
  listenersInstalled = false;
  dragDepth = 0;
};

const registerDropZone = (subscriber: Subscriber) => {
  subscribers.push(subscriber);
  installListeners();
  return () => {
    const index = subscribers.indexOf(subscriber);
    if (index >= 0) subscribers.splice(index, 1);
    if (subscribers.length === 0) uninstallListeners();
  };
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

  // Keep the latest openUpload without re-registering (and re-ordering) the
  // subscriber on every render.
  const openUploadRef = useRef(openUpload);
  openUploadRef.current = openUpload;

  useEffect(() => {
    const unregister = registerDropZone({
      openUpload: (file) => openUploadRef.current({ initialFile: file }),
      setDraggingOver,
    });
    return () => {
      unregister();
      setDraggingOver(false);
    };
  }, []);

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

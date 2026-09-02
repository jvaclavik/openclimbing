import React, { useEffect } from 'react';
import { Dialog } from '@mui/material';
import styled from '@emotion/styled';
import { useEditDialogContext } from '../helpers/EditDialogContext';
import { useEditDialogClose, useEditDialogFeature } from './utils';
import { useEditContext } from './context/EditContext';
import { fetchFreshItem, getNewNodeItem } from './context/itemsHelpers';
import {
  EditDialogContent,
  EditDialogLoadingSkeleton,
} from './EditDialogContent';
import { EditDialogUploadProvider } from './EditDialogUploadContext';
import { EditDialogDropZone } from './EditDialogDropZone';

const StyledDialog = styled(Dialog)`
  .MuiDialog-container.MuiDialog-scrollPaper {
    align-items: start;
  }
`;

const CustomizedDialog: React.FC = ({ children }) => {
  const handleClose = useEditDialogClose();
  const { opened } = useEditDialogContext();
  const { items } = useEditContext();
  const { successInfo } = useEditContext();
  const isModified = items.some(({ modified }) => modified);

  return (
    <StyledDialog
      fullScreen // the edit dialog always opens fullscreen (shared map needs the room)
      open={opened}
      onClose={(event, reason) => {
        if (isModified && !successInfo && reason === 'escapeKeyDown') return;
        handleClose();
      }}
      disableEnforceFocus
      aria-labelledby="edit-dialog-title"
      slotProps={{
        paper: {
          sx: { height: '100%' },
          elevation: 0,
        },
      }}
      sx={{ height: '100%' }}
    >
      {children}
    </StyledDialog>
  );
};

const EditDialogFetcher = () => {
  const { feature } = useEditDialogFeature();
  const { current, addItem, setCurrent } = useEditContext();

  useEffect(() => {
    if (current) {
      return; // for development
    }

    (async () => {
      if (feature.osmMeta.id < 0) {
        const newItem = getNewNodeItem(feature.center, feature.tags);
        addItem(newItem);
        setCurrent(newItem.shortId);
      } else {
        const newItem = await fetchFreshItem(feature.osmMeta); // TODO potentially leaking - use react-query (with max repetions 10?)
        addItem(newItem);
        setCurrent(newItem.shortId);
      }
    })();
  }, [addItem, current, feature, setCurrent]);

  if (!current) {
    return <EditDialogLoadingSkeleton />;
  }
  return <EditDialogContent />;
};

// The whole edit UI (MUI dialog, forms, preset/tag editors, photo upload) is
// only ever shown once the user opens the editor. It lives in its own lazily
// loaded chunk so it stays out of the shared _app bundle.
export const EditDialogBody = () => (
  <EditDialogUploadProvider>
    <CustomizedDialog>
      <EditDialogDropZone>
        <EditDialogFetcher />
      </EditDialogDropZone>
    </CustomizedDialog>
  </EditDialogUploadProvider>
);

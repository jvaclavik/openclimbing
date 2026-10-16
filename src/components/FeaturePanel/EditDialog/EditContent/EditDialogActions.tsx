import { Alert, Button, CircularProgress, DialogActions } from '@mui/material';
import React from 'react';
import { t } from '../../../../services/intl';
import { useEditContext } from '../context/EditContext';
import { getMovedExistingItems } from './getMovedExistingItems';
import { useGetHandleSave } from '../useGetHandleSave';
import { useEditDialogClose } from '../utils';

const SaveButton = () => {
  const handleSave = useGetHandleSave();
  const { items } = useEditContext();
  const disabled = !items.some((item) => item.modified);

  return (
    <Button
      onClick={handleSave}
      color="primary"
      variant="contained"
      disabled={disabled}
    >
      {t('editdialog.save_button_edit')}
    </Button>
  );
};

const CancelButton = () => {
  const handleClose = useEditDialogClose();

  return (
    <Button onClick={handleClose} color="primary">
      {t('editdialog.cancel_button')}
    </Button>
  );
};

const MovedExistingItemsWarning = () => {
  const { items } = useEditContext();
  const moved = getMovedExistingItems(items).map(
    ({ item, meters }) => `${item.tags.name || item.presetLabel} (${meters} m)`,
  );

  if (!moved.length) return null;

  return (
    <Alert severity="info" sx={{ mx: 2, mb: 1 }}>
      {t('editdialog.moved_existing_items', {
        names: moved.slice(0, 5).join(', ') + (moved.length > 5 ? ', …' : ''),
      })}
    </Alert>
  );
};

export const EditDialogActions = () => {
  const { isSaving } = useEditContext();

  return (
    <>
      <MovedExistingItemsWarning />
      <DialogActions>
        <div style={{ flex: '1 1' }}></div>
        {isSaving && <CircularProgress size={20} />}
        <CancelButton />

        <SaveButton />
      </DialogActions>
    </>
  );
};

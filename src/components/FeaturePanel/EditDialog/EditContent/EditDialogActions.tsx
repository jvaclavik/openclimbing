import { Button, CircularProgress, DialogActions } from '@mui/material';
import React from 'react';
import { t } from '../../../../services/intl';
import { useEditContext } from '../context/EditContext';
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

export const EditDialogActions = () => {
  const { isSaving } = useEditContext();

  return (
    <DialogActions>
      <div style={{ flex: '1 1' }}></div>
      {isSaving && <CircularProgress size={20} />}
      <CancelButton />

      <SaveButton />
    </DialogActions>
  );
};

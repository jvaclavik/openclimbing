import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { t } from '../../services/intl';
import { useTicksContext } from '../utils/TicksContext';
import { useSnackbar } from '../utils/SnackbarContext';

type Props = {
  open: boolean;
  tickIds: number[];
  onClose: () => void;
  onDeleted: () => void;
};

export const BulkDeleteTicksDialog = ({
  open,
  tickIds,
  onClose,
  onDeleted,
}: Props) => {
  const { bulkDeleteTicks } = useTicksContext();
  const { showToast } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const count = String(tickIds.length);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await bulkDeleteTicks(tickIds);
      showToast(t('my_ticks.bulk_delete.done_toast', { count }), 'success');
      onDeleted();
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>{t('my_ticks.bulk_delete.title', { count })}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('my_ticks.bulk_delete.body')}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {t('editdialog.cancel_button')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          loading={loading}
        >
          {t('my_ticks.bulk_delete.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

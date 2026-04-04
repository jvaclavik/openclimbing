import React, { useEffect, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { clone } from 'lodash';
import { useSnackbar } from '../../utils/SnackbarContext';
import { ClimbingTick } from '../../../types';
import { useTicksContext } from '../../utils/TicksContext';
import {
  applyDateInputToTickTimestamp,
  isClimbCalendarDateAfterToday,
  todayDateInputMax,
} from '../../../services/my-ticks/tickTimestampInput';
import { t } from '../../../services/intl';
import { EditTickFormFields } from './EditTickFormFields';

const useTempTick = () => {
  const { editedTickId, ticks, isFetching } = useTicksContext();
  const [tempTick, setTempTick] = useState<ClimbingTick>(undefined);

  useEffect(() => {
    if (editedTickId && !isFetching && ticks) {
      const found = ticks.find((tick) => tick.id === editedTickId);
      if (found) {
        let next = clone(found);
        if (isClimbCalendarDateAfterToday(next.timestamp)) {
          next = {
            ...next,
            timestamp: applyDateInputToTickTimestamp(
              next.timestamp,
              todayDateInputMax(),
            ),
          };
        }
        setTempTick(next);
      }
    }
  }, [ticks, isFetching, editedTickId]);

  const updateTempTick = (key: string, value: unknown) => {
    setTempTick((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  return { tempTick, updateTempTick };
};

export const EditTickModal = () => {
  const { updateTick, editedTickId, setEditedTickId, ticks } =
    useTicksContext();
  const { showToast } = useSnackbar();
  const { tempTick, updateTempTick } = useTempTick();
  const [loading, setLoading] = useState<boolean>(false);

  const onClose = () => {
    setEditedTickId(null);
  };

  const handleSave = async () => {
    if (isClimbCalendarDateAfterToday(tempTick.timestamp)) {
      showToast(t('tick.date_future_error'), 'error');
      return;
    }
    setLoading(true);
    try {
      await updateTick(tempTick);
      showToast(t('tick.save_success'), 'success');
      onClose();
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!editedTickId}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          pr: 5,
          pb: 1,
          typography: 'h6',
        }}
      >
        {t('tick.edit_dialog_title')}
        <Tooltip title={t('close_panel')}>
          <IconButton
            aria-label={t('close_panel')}
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary',
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, px: 3 }}>
        {tempTick ? (
          <EditTickFormFields
            key={tempTick.id}
            tempTick={tempTick}
            updateTempTick={updateTempTick}
            allTicks={ticks ?? []}
          />
        ) : (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {t('editdialog.cancel_button')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!tempTick || loading}
          loading={loading}
        >
          {t('tick.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

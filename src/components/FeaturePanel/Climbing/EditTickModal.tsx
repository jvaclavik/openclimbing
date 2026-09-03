import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import clone from 'lodash/clone';
import { useSnackbar } from '../../utils/SnackbarContext';
import { ClimbingTick } from '../../../types';
import { useTicksContext } from '../../utils/TicksContext';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { useMoreMenu } from './useMoreMenu';
import { EditTickButton } from './EditTickButton';
import { TickStyle } from './types';
import {
  applyDateInputToTickTimestamp,
  isClimbCalendarDateAfterToday,
  todayDateInputMax,
} from '../../../services/my-ticks/tickTimestampInput';
import { t } from '../../../services/intl';
import { EditTickFormFields } from './EditTickFormFields';
import { getShortId } from '../../../services/helpers';
import { getTickRouteLabel } from '../../../services/my-ticks/getTickRouteLabel';
import { useFeatureContext } from '../../utils/FeatureContext';

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
  const { updateTick, deleteTick, editedTickId, setEditedTickId, ticks } =
    useTicksContext();
  const { showToast } = useSnackbar();
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const { tempTick, updateTempTick } = useTempTick();
  const { feature } = useFeatureContext();
  const [loading, setLoading] = useState<boolean>(false);
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();

  const routeLabel = useMemo(() => {
    if (!tempTick) {
      return null;
    }
    const featureName =
      feature && tempTick.shortId === getShortId(feature.osmMeta)
        ? (feature.tags?.name ?? feature.tags?.ref)
        : null;
    const name = getTickRouteLabel(tempTick, featureName);
    const grade = tempTick.routeGradeTxt?.trim();
    return grade ? `${name} · ${grade}` : name;
  }, [tempTick, feature]);

  const onClose = () => {
    setEditedTickId(null);
  };

  const handleDelete = async (event: React.MouseEvent) => {
    setLoading(true);
    try {
      await deleteTick(tempTick.id);
      showToast(t('tick.deleted_toast'), 'success');
      handleCloseMore(event);
      onClose();
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isClimbCalendarDateAfterToday(tempTick.timestamp)) {
      showToast(t('tick.date_future_error'), 'error');
      return;
    }
    setLoading(true);
    try {
      await updateTick(tempTick);
      if (userSettings['climbing.rememberTickDefaults']) {
        setUserSetting('climbing.tickDefaults', {
          style: tempTick.style as TickStyle,
          timestamp: tempTick.timestamp,
          pairing: tempTick.pairing,
          savedOn: todayDateInputMax(),
        });
      }
      const savedTickId = tempTick.id;
      showToast(
        t('tick.save_success'),
        'success',
        <EditTickButton onClick={() => setEditedTickId(savedTickId)} />,
      );
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
        {routeLabel && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 400 }}
          >
            {routeLabel}
          </Typography>
        )}
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
          <Stack
            sx={{
              alignItems: 'center',
              py: 4,
            }}
          >
            <CircularProgress />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Tooltip title={t('show_more')}>
          <IconButton
            color="secondary"
            onClick={handleClickMore}
            disabled={!tempTick || loading}
          >
            <MoreHorizIcon color="secondary" />
          </IconButton>
        </Tooltip>
        <MoreMenu>
          <MenuItem onClick={handleDelete} disableRipple disabled={loading}>
            <DeleteIcon />
            {t('tick.delete_button')} &nbsp;
            {loading && <CircularProgress size={20} />}
          </MenuItem>
        </MoreMenu>
        <Box sx={{ flexGrow: 1 }} />
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

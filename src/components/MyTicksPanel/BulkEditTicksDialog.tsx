import React, { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ClimbingTick } from '../../types';
import { t } from '../../services/intl';
import { useTicksContext } from '../utils/TicksContext';
import { useSnackbar } from '../utils/SnackbarContext';
import { TickStyle } from '../FeaturePanel/Climbing/types';
import { TickStyleSelect } from '../FeaturePanel/Climbing/Ticks/TickStyleSelect';
import { PartnersTextField } from '../FeaturePanel/Climbing/PartnersTextField';
import {
  collectPartnerSuggestionsFromTicks,
  getPartnersText,
  setPartnersOnPairing,
} from '../../services/my-ticks/tickPairing';
import {
  applyDateInputToTickTimestamp,
  clampDateInputYyyyMmDd,
  tickTimestampToDateInputValue,
  todayDateInputMax,
} from '../../services/my-ticks/tickTimestampInput';

type Field<T> = { enabled: boolean; value: T };

/** Shared value of all ticks, or `undefined` when they differ. */
const commonValue = <T,>(values: T[]): T | undefined =>
  values.length > 0 && values.every((v) => v === values[0])
    ? values[0]
    : undefined;

const getInitialFields = (ticks: ClimbingTick[]) => ({
  style: commonValue(ticks.map((tick) => tick.style as TickStyle)),
  date: commonValue(
    ticks.map((tick) => tickTimestampToDateInputValue(tick.timestamp)),
  ),
  partners: commonValue(ticks.map(getPartnersText)),
  note: commonValue(ticks.map((tick) => tick.note ?? '')),
});

const FieldToggle = ({
  label,
  field,
  mixed,
  onToggle,
  children,
}: {
  label: string;
  field: Field<unknown>;
  mixed: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) => (
  <Stack spacing={0.5}>
    <FormControlLabel
      control={
        <Checkbox
          size="small"
          checked={field.enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
      }
      label={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <span>{label}</span>
          {mixed ? (
            <Typography variant="caption" color="text.secondary">
              {t('my_ticks.bulk_edit.mixed')}
            </Typography>
          ) : null}
        </Stack>
      }
    />
    <Stack sx={{ pl: 4, opacity: field.enabled ? 1 : 0.6 }}>{children}</Stack>
  </Stack>
);

type Props = {
  ticks: ClimbingTick[];
  onClose: () => void;
  onSaved: () => void;
};

/** Mount only while open — initial values are derived from `ticks` on mount. */
export const BulkEditTicksDialog = ({ ticks, onClose, onSaved }: Props) => {
  const { bulkUpdateTicks, ticks: allTicks } = useTicksContext();
  const { showToast } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const initial = useMemo(() => getInitialFields(ticks), []); // eslint-disable-line react-hooks/exhaustive-deps
  const maxDay = todayDateInputMax();

  const [style, setStyle] = useState<Field<TickStyle | ''>>({
    enabled: false,
    value: initial.style ?? '',
  });
  const [date, setDate] = useState<Field<string>>({
    enabled: false,
    value: initial.date || maxDay,
  });
  const [partners, setPartners] = useState<Field<string>>({
    enabled: false,
    value: initial.partners ?? '',
  });
  const [note, setNote] = useState<Field<string>>({
    enabled: false,
    value: initial.note ?? '',
  });

  const partnerSuggestions = useMemo(
    () => collectPartnerSuggestionsFromTicks(allTicks ?? []),
    [allTicks],
  );

  const anyEnabled =
    style.enabled || date.enabled || partners.enabled || note.enabled;
  const styleInvalid = style.enabled && !style.value;
  const count = String(ticks.length);

  const handleSave = async () => {
    const updates = ticks.map((tick) => ({
      id: tick.id,
      ...(style.enabled ? { style: style.value } : {}),
      ...(date.enabled
        ? {
            timestamp: applyDateInputToTickTimestamp(
              tick.timestamp,
              clampDateInputYyyyMmDd(date.value, maxDay),
            ),
          }
        : {}),
      ...(partners.enabled
        ? { pairing: setPartnersOnPairing(tick.pairing, partners.value) }
        : {}),
      ...(note.enabled ? { note: note.value.trim() ? note.value : null } : {}),
    }));

    setLoading(true);
    try {
      await bulkUpdateTicks(updates);
      showToast(t('my_ticks.bulk_edit.done_toast', { count }), 'success');
      onSaved();
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {t('my_ticks.bulk_edit.title', { count })}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, fontWeight: 400 }}
        >
          {t('my_ticks.bulk_edit.hint')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, px: 3 }}>
        <Stack spacing={2}>
          <FieldToggle
            label={t('my_ticks.route_style')}
            field={style}
            mixed={initial.style === undefined}
            onToggle={(enabled) => setStyle((f) => ({ ...f, enabled }))}
          >
            <TickStyleSelect
              fullWidth
              value={style.value as TickStyle}
              onChange={(e) =>
                setStyle({ enabled: true, value: e.target.value })
              }
            />
          </FieldToggle>

          <FieldToggle
            label={t('tick.date_label')}
            field={date}
            mixed={initial.date === undefined}
            onToggle={(enabled) => setDate((f) => ({ ...f, enabled }))}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={date.value}
                onChange={(e) =>
                  setDate({
                    enabled: true,
                    value: clampDateInputYyyyMmDd(e.target.value, maxDay),
                  })
                }
                slotProps={{
                  htmlInput: {
                    max: maxDay,
                    'aria-label': t('tick.date_label'),
                  },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                disabled={date.enabled && date.value === maxDay}
                onClick={() => setDate({ enabled: true, value: maxDay })}
                sx={{ flexShrink: 0 }}
              >
                {t('tick.today_button')}
              </Button>
            </Stack>
          </FieldToggle>

          <FieldToggle
            label={t('tick.partners_label')}
            field={partners}
            mixed={initial.partners === undefined}
            onToggle={(enabled) => setPartners((f) => ({ ...f, enabled }))}
          >
            <PartnersTextField
              ariaLabel={t('tick.partners_label')}
              helperText={t('tick.partners_helper')}
              placeholder={t('tick.partners_placeholder')}
              value={partners.value}
              onChange={(value) => setPartners({ enabled: true, value })}
              suggestions={partnerSuggestions}
            />
          </FieldToggle>

          <FieldToggle
            label={t('tick.note_label')}
            field={note}
            mixed={initial.note === undefined}
            onToggle={(enabled) => setNote((f) => ({ ...f, enabled }))}
          >
            <TextField
              value={note.value}
              onChange={(e) =>
                setNote({ enabled: true, value: e.target.value })
              }
              fullWidth
              multiline
              minRows={2}
              size="small"
              slotProps={{ htmlInput: { 'aria-label': t('tick.note_label') } }}
            />
          </FieldToggle>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {t('editdialog.cancel_button')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!anyEnabled || styleInvalid}
          loading={loading}
        >
          {t('tick.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

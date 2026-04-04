import React, { useMemo, useState } from 'react';
import { Button, Collapse, Stack, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ClimbingTick } from '../../../types';
import { TickStyle } from './types';
import { TickStyleSelect } from './Ticks/TickStyleSelect';
import { PartnersTextField } from './PartnersTextField';
import {
  collectPartnerSuggestionsFromTicks,
  getPartnersFromLastClimbedRoute,
  getPartnersText,
  setPartnersOnPairing,
} from '../../../services/my-ticks/tickPairing';
import {
  applyDateInputToTickTimestamp,
  clampDateInputYyyyMmDd,
  tickTimestampToDateInputValue,
  todayDateInputMax,
} from '../../../services/my-ticks/tickTimestampInput';
import { t } from '../../../services/intl';

export const EditTickFormFields = ({
  tempTick,
  updateTempTick,
  allTicks,
}: {
  tempTick: ClimbingTick;
  updateTempTick: <T extends keyof ClimbingTick>(
    key: T,
    value: ClimbingTick[T],
  ) => void;
  allTicks: ClimbingTick[];
}) => {
  const [moreOpen, setMoreOpen] = useState(
    () => !!(tempTick.myGrade?.trim() || tempTick.note?.trim()),
  );
  const partnerSuggestions = useMemo(
    () => collectPartnerSuggestionsFromTicks(allTicks),
    [allTicks],
  );
  const lastRoutePartners = useMemo(
    () => getPartnersFromLastClimbedRoute(allTicks, tempTick),
    [allTicks, tempTick],
  );

  const maxDay = todayDateInputMax();

  return (
    <Stack spacing={2.5}>
      <TickStyleSelect
        fullWidth
        value={tempTick.style as TickStyle}
        onChange={(e) => updateTempTick('style', e.target.value)}
      />

      <TextField
        label={t('tick.date_label')}
        type="date"
        fullWidth
        size="small"
        value={tickTimestampToDateInputValue(tempTick.timestamp)}
        onChange={(e) => {
          const clamped = clampDateInputYyyyMmDd(e.target.value, maxDay);
          updateTempTick(
            'timestamp',
            applyDateInputToTickTimestamp(tempTick.timestamp, clamped),
          );
        }}
        InputLabelProps={{ shrink: true }}
        inputProps={{
          max: maxDay,
        }}
      />

      <PartnersTextField
        label={t('tick.partners_label')}
        helperText={t('tick.partners_helper')}
        placeholder={t('tick.partners_placeholder')}
        value={getPartnersText(tempTick)}
        onChange={(partners) =>
          updateTempTick(
            'pairing',
            setPartnersOnPairing(tempTick.pairing, partners),
          )
        }
        suggestions={partnerSuggestions}
        onFillFromLastRoute={() => {
          if (lastRoutePartners) {
            updateTempTick(
              'pairing',
              setPartnersOnPairing(tempTick.pairing, lastRoutePartners),
            );
          }
        }}
        fillFromLastRouteDisabled={lastRoutePartners == null}
      />

      <Button
        fullWidth
        variant="text"
        size="small"
        color="inherit"
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen((v) => !v)}
        endIcon={
          <ExpandMoreIcon
            sx={{
              transform: moreOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        }
        sx={{ justifyContent: 'space-between', textTransform: 'none', py: 0.5 }}
      >
        {moreOpen ? t('show_less') : t('show_more')}
      </Button>

      <Collapse in={moreOpen} timeout="auto" unmountOnExit>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            label={t('tick.my_grade_label')}
            value={tempTick.myGrade ?? ''}
            onChange={(e) => {
              updateTempTick('myGrade', e.target.value || null);
            }}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label={t('tick.note_label')}
            value={tempTick.note ?? ''}
            onChange={(e) => {
              updateTempTick('note', e.target.value || null);
            }}
            fullWidth
            multiline
            minRows={2}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Collapse>
    </Stack>
  );
};

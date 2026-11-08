import React, { useMemo, useState } from 'react';
import { Alert, Box, Checkbox, Stack, Typography } from '@mui/material';
import { t } from '../../services/intl';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  applyTicksUrlFilter,
  useTicksUrlFilter,
} from '../../services/my-ticks/ticksUrlFilter';
import {
  getGroupSelectionState,
  MyTicksContent,
  MyTicksEmptyHint,
} from '../MyTicksPanel/MyTicksContent';
import { TicksBulkToolbar } from '../MyTicksPanel/TicksBulkToolbar';
import { TicksSortMenu } from '../MyTicksPanel/TicksSortMenu';
import { DEFAULT_TICKS_SORT, TicksSortKey } from '../MyTicksPanel/ticksSort';
import {
  TickSelection,
  useTickSelection,
} from '../MyTicksPanel/useTickSelection';
import { GradeSystemSelect } from '../FeaturePanel/Climbing/GradeSystemSelect';

const SelectAllCheckbox = ({
  selection,
  visibleIds,
}: {
  selection: TickSelection;
  visibleIds: number[];
}) => {
  const state = getGroupSelectionState(visibleIds, selection.selectedIds);
  return (
    <Checkbox
      size="small"
      checked={state.checked}
      indeterminate={state.indeterminate}
      onChange={() => selection.setMany(visibleIds, !state.checked)}
      slotProps={{ input: { 'aria-label': t('my_ticks.select.select_all') } }}
      sx={{ ml: -1 }}
    />
  );
};

const useVisibleTicks = (
  fetchedTicks: FetchedClimbingTick[],
  selection: TickSelection,
) => {
  const filter = useTicksUrlFilter();
  const visible = useMemo(
    () => applyTicksUrlFilter(fetchedTicks, filter),
    [fetchedTicks, filter],
  );
  const visibleIds = useMemo(
    () => visible.map((row) => row.tick.id),
    [visible],
  );
  // Act only on selected ticks that are still visible (filter may change,
  // ticks may get deleted elsewhere).
  const selectedTicks = useMemo(
    () =>
      selection.active
        ? visible
            .filter((row) => selection.selectedIds.has(row.tick.id))
            .map((row) => row.tick)
        : [],
    [visible, selection.active, selection.selectedIds],
  );
  return { visibleIds, selectedTicks };
};

export const UserProfileDiaryTab = ({
  own,
  fetchedTicks,
  personalBestIds,
}: {
  own: boolean;
  fetchedTicks: FetchedClimbingTick[];
  personalBestIds: ReadonlySet<number>;
}) => {
  const selection = useTickSelection();
  const [sortKey, setSortKey] = useState<TicksSortKey>(DEFAULT_TICKS_SORT);
  const { visibleIds, selectedTicks } = useVisibleTicks(
    fetchedTicks,
    selection,
  );
  const canSelect = own && fetchedTicks.length > 0;
  const selecting = canSelect && selection.active;

  return (
    <Box sx={{ pt: 0.5 }}>
      {fetchedTicks.length > 0 ? (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 0.5,
            mb: 0.5,
            minHeight: 40,
          }}
        >
          {selecting ? (
            <SelectAllCheckbox selection={selection} visibleIds={visibleIds} />
          ) : (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TicksSortMenu value={sortKey} onChange={setSortKey} />
              <GradeSystemSelect size="tiny" />
            </Stack>
          )}
          {canSelect ? (
            <TicksBulkToolbar
              selection={selection}
              selectedTicks={selectedTicks}
            />
          ) : null}
        </Stack>
      ) : null}
      {selecting && selectedTicks.length === 0 ? (
        <Typography
          variant="caption"
          component="p"
          sx={{ color: 'text.secondary', mb: 1 }}
        >
          {t('my_ticks.select.hint')}
        </Typography>
      ) : null}
      <MyTicksContent
        fetchedTicks={fetchedTicks}
        readOnly={!own}
        selection={canSelect ? selection : undefined}
        sortKey={sortKey}
        personalBestIds={personalBestIds}
        emptyTicksMessage={
          own ? (
            <MyTicksEmptyHint />
          ) : (
            <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
              {t('user_profile.no_ticks')}
            </Alert>
          )
        }
      />
    </Box>
  );
};

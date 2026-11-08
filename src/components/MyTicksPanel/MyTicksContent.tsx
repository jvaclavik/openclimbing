import React from 'react';
import { Stack, Typography } from '@mui/material';
import { t } from '../../services/intl';
import { PanelSidePadding } from '../utils/PanelHelpers';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  applyTicksUrlFilter,
  isTicksFilterActive,
  useTicksUrlFilter,
} from '../../services/my-ticks/ticksUrlFilter';
import { MyTicksRow } from './MyTicksRow';
import { TicksFilterBanner } from './TicksFilterBanner';
import { groupTicksByDay } from './groupTicksByDay';
import { TickColumn, TickSessionCard } from './TickSessionCard';
import { getDayCrags } from './dayCrags';
import { sessionDateFromTimestamp } from '../../services/my-ticks/ticksUrlFilter';
import { MyTicksDayHeader } from './MyTicksDayHeader';
import { TickSelection } from './useTickSelection';
import {
  DEFAULT_TICKS_SORT,
  isGroupedByDay,
  sortTicks,
  TicksSortKey,
} from './ticksSort';

export const getGroupSelectionState = (
  ids: readonly number[],
  selectedIds: ReadonlySet<number>,
) => {
  const selectedCount = ids.filter((id) => selectedIds.has(id)).length;
  return {
    checked: ids.length > 0 && selectedCount === ids.length,
    indeterminate: selectedCount > 0 && selectedCount < ids.length,
  };
};

/** Hint when the logged-in user has no ticks (e.g. climbing profile). */
export function MyTicksEmptyHint() {
  return (
    <PanelSidePadding>
      <Typography variant="body1" gutterBottom>
        {t('my_ticks.no_ticks_paragraph1')}
      </Typography>

      <Typography
        variant="caption"
        gutterBottom
        color="secondary"
        sx={{
          display: 'block',
        }}
      >
        {t('my_ticks.no_ticks_paragraph2')}
      </Typography>
    </PanelSidePadding>
  );
}

type MyTicksContentProps = {
  fetchedTicks: FetchedClimbingTick[];
  readOnly?: boolean;
  emptyTicksMessage?: React.ReactNode;
  /** Bulk selection state; checkboxes are shown while `selection.active`. */
  selection?: TickSelection;
  sortKey?: TicksSortKey;
  /** Ticks that set a new personal best grade. */
  personalBestIds?: ReadonlySet<number>;
};

export type TickSession = {
  /** YYYY-MM-DD, or null for an ungrouped list. */
  day: string | null;
  rows: FetchedClimbingTick[];
};

/** Rows grouped into climbing days (one card each), or one plain list. */
export const toSessions = (
  rows: FetchedClimbingTick[],
  groupByDay: boolean,
): TickSession[] =>
  groupByDay
    ? groupTicksByDay(rows).flatMap((item) =>
        item.type === 'header'
          ? [{ day: item.sessionDate, rows: item.sessionTicks }]
          : [],
      )
    : [{ day: null, rows }];

export const MyTicksContent = ({
  fetchedTicks,
  readOnly = false,
  emptyTicksMessage,
  selection,
  sortKey = DEFAULT_TICKS_SORT,
  personalBestIds,
}: MyTicksContentProps) => {
  const selecting = !readOnly && !!selection?.active;
  const selectedIds = selection?.selectedIds;

  const filter = useTicksUrlFilter();
  const filterActive = isTicksFilterActive(filter);
  const filteredTicks = React.useMemo(
    () => applyTicksUrlFilter(fetchedTicks, filter),
    [fetchedTicks, filter],
  );
  const visibleRows = React.useMemo(
    () => sortTicks(filteredTicks, sortKey),
    [filteredTicks, sortKey],
  );
  const groupByDay = isGroupedByDay(sortKey);
  const sessions = React.useMemo(
    () => toSessions(visibleRows, groupByDay),
    [visibleRows, groupByDay],
  );
  // Days with a single crag show it only in the day header.
  const singleCragDays = React.useMemo(
    () =>
      new Set(
        sessions.flatMap((session) =>
          session.day && getDayCrags(session.rows).length <= 1
            ? [session.day]
            : [],
        ),
      ),
    [sessions],
  );
  // Visible order of tick ids — used for SHIFT range selection.
  const visibleOrderedIds = React.useMemo(
    () => visibleRows.map((row) => row.tick.id),
    [visibleRows],
  );

  const showActions = !readOnly && !selecting;

  if (fetchedTicks?.length === 0) {
    return <>{emptyTicksMessage ?? <MyTicksEmptyHint />}</>;
  }

  const columns = [
    selecting && 'checkbox',
    'name',
    'grade',
    'style',
    'points',
    !groupByDay && 'date',
    showActions && 'more',
  ].filter(Boolean) as TickColumn[];

  const renderRow = (tickRow: FetchedClimbingTick) => (
    <MyTicksRow
      fetchedTick={tickRow}
      key={tickRow.tick.id}
      readOnly={readOnly}
      showDate={!groupByDay}
      showCrag={
        !groupByDay ||
        !singleCragDays.has(sessionDateFromTimestamp(tickRow.date))
      }
      personalBest={personalBestIds?.has(tickRow.tick.id)}
      highlighted={
        filter.highlightTickId != null &&
        tickRow.tick.id === filter.highlightTickId
      }
      selection={
        selecting
          ? {
              selected: selectedIds.has(tickRow.tick.id),
              onClick: (modifiers) =>
                selection.click(tickRow.tick.id, modifiers, visibleOrderedIds),
            }
          : undefined
      }
    />
  );

  const renderHeader = (session: TickSession) => {
    const dayIds = session.rows.map((row) => row.tick.id);
    const dayState = selecting
      ? getGroupSelectionState(dayIds, selectedIds)
      : null;
    return (
      <MyTicksDayHeader
        sessionDate={session.day}
        sessionTicks={session.rows}
        showShareAction={!readOnly}
        selection={
          dayState
            ? {
                ...dayState,
                onToggle: () => selection.setMany(dayIds, !dayState.checked),
              }
            : undefined
        }
      />
    );
  };

  return (
    <>
      {filterActive ? (
        <TicksFilterBanner
          filter={filter}
          matchedCount={filteredTicks.length}
          totalCount={fetchedTicks.length}
        />
      ) : null}
      <Stack spacing={2.5}>
        {sessions.map((session) => (
          <TickSessionCard
            key={session.day ?? 'all'}
            header={session.day ? renderHeader(session) : null}
            columns={columns}
          >
            {session.rows.map(renderRow)}
          </TickSessionCard>
        ))}
      </Stack>
    </>
  );
};

import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from '@mui/material';
import { t } from '../../services/intl';
import { PanelSidePadding } from '../utils/PanelHelpers';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  applyTicksUrlFilter,
  isTicksFilterActive,
  useTicksUrlFilter,
} from '../../services/my-ticks/ticksUrlFilter';
import { useSortedTable } from './useSortedTable';
import { MyTicksRow } from './MyTicksRow';
import { TicksFilterBanner } from './TicksFilterBanner';
import { groupTicksByDay } from './groupTicksByDay';
import { MyTicksDayHeader } from './MyTicksDayHeader';
import { TickSelection } from './useTickSelection';

const getGroupSelectionState = (
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
};

export const MyTicksContent = ({
  fetchedTicks,
  readOnly = false,
  emptyTicksMessage,
  selection,
}: MyTicksContentProps) => {
  const selecting = !readOnly && !!selection?.active;
  const selectedIds = selection?.selectedIds;

  const filter = useTicksUrlFilter();
  const filterActive = isTicksFilterActive(filter);
  const filteredTicks = React.useMemo(
    () => applyTicksUrlFilter(fetchedTicks, filter),
    [fetchedTicks, filter],
  );

  const filteredIds = React.useMemo(
    () => filteredTicks.map((row) => row.tick.id),
    [filteredTicks],
  );
  const allSelectionState =
    selecting && selectedIds
      ? getGroupSelectionState(filteredIds, selectedIds)
      : null;

  const { visibleRows, tableHeader, groupByDay, columnCount } = useSortedTable(
    filteredTicks,
    {
      showActionsColumn: !readOnly && !selecting,
      selectAllColumn: allSelectionState
        ? {
            ...allSelectionState,
            onToggle: () =>
              selection.setMany(filteredIds, !allSelectionState.checked),
          }
        : undefined,
    },
  );

  // Visible (sorted) order of tick ids — used for SHIFT range selection.
  // Not memoized: `visibleRows` is sorted in place, keeping its reference.
  const visibleOrderedIds = selecting
    ? visibleRows.map((row) => row.tick.id)
    : [];

  const items = React.useMemo(
    () =>
      groupByDay
        ? groupTicksByDay(visibleRows)
        : visibleRows.map(
            (row) =>
              ({
                type: 'row',
                row,
              }) as ReturnType<typeof groupTicksByDay>[number],
          ),
    [groupByDay, visibleRows],
  );

  const emptyContent = emptyTicksMessage ?? <MyTicksEmptyHint />;

  const banner = filterActive ? (
    <TicksFilterBanner
      filter={filter}
      matchedCount={filteredTicks.length}
      totalCount={fetchedTicks.length}
    />
  ) : null;

  if (fetchedTicks?.length === 0) {
    return <>{emptyContent}</>;
  }

  return (
    <>
      {banner}
      <TableContainer
        component={Paper}
        sx={{
          // Bleed past the parent panel's 16px horizontal padding so the table
          // touches the panel edges.
          mx: -2,
          width: 'auto',
          overflowX: 'auto',
          borderRadius: 0,
        }}
      >
        <Table size="small">
          {tableHeader}
          <TableBody>
            {items.map((item) => {
              if (item.type === 'header') {
                return (
                  <MyTicksDayHeader
                    key={`header-${item.sessionDate}`}
                    sessionDate={item.sessionDate}
                    sessionTicks={item.sessionTicks}
                    colSpan={columnCount}
                    showShareAction={!readOnly}
                    selection={
                      selecting
                        ? (() => {
                            const dayIds = item.sessionTicks.map(
                              (row) => row.tick.id,
                            );
                            const state = getGroupSelectionState(
                              dayIds,
                              selectedIds,
                            );
                            return {
                              ...state,
                              onToggle: () =>
                                selection.setMany(dayIds, !state.checked),
                            };
                          })()
                        : undefined
                    }
                  />
                );
              }
              const tickRow = item.row;
              return (
                <MyTicksRow
                  fetchedTick={tickRow}
                  key={tickRow.tick.id}
                  readOnly={readOnly}
                  highlighted={
                    filter.highlightTickId != null &&
                    tickRow.tick.id === filter.highlightTickId
                  }
                  selection={
                    selecting
                      ? {
                          selected: selectedIds.has(tickRow.tick.id),
                          onClick: (modifiers) =>
                            selection.click(
                              tickRow.tick.id,
                              modifiers,
                              visibleOrderedIds,
                            ),
                        }
                      : undefined
                  }
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

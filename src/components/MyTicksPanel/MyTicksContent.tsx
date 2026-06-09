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

/** Hint when the logged-in user has no ticks (e.g. climbing profile). */
export function MyTicksEmptyHint() {
  return (
    <PanelSidePadding>
      <Typography variant="body1" gutterBottom>
        {t('my_ticks.no_ticks_paragraph1')}
      </Typography>

      <Typography
        variant="caption"
        display="block"
        gutterBottom
        color="secondary"
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
};

export const MyTicksContent = ({
  fetchedTicks,
  readOnly = false,
  emptyTicksMessage,
}: MyTicksContentProps) => {
  const filter = useTicksUrlFilter();
  const filterActive = isTicksFilterActive(filter);
  const filteredTicks = React.useMemo(
    () => applyTicksUrlFilter(fetchedTicks, filter),
    [fetchedTicks, filter],
  );

  const { visibleRows, tableHeader, groupByDay, columnCount } = useSortedTable(
    filteredTicks,
    { showActionsColumn: !readOnly },
  );

  const items = React.useMemo(
    () =>
      groupByDay
        ? groupTicksByDay(visibleRows)
        : visibleRows.map(
            (row) =>
              ({ type: 'row', row }) as ReturnType<
                typeof groupTicksByDay
              >[number],
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
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

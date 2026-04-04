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
import { useSortedTable } from './useSortedTable';
import { MyTicksRow } from './MyTicksRow';
import { MyTicksGraphs } from './MyTicksGraphs/MyTicksGraphs';
import { fetchedTicksToGraphFeatures } from './mapMyTicksRows';

function NoTicksContent() {
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
  const { visibleRows, tableHeader } = useSortedTable(fetchedTicks, {
    showActionsColumn: !readOnly,
  });

  const emptyContent = emptyTicksMessage ?? <NoTicksContent />;

  return (
    <>
      {fetchedTicks?.length === 0 ? (
        emptyContent
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            {tableHeader}
            <TableBody>
              {visibleRows.map((tickRow) => (
                <MyTicksRow
                  fetchedTick={tickRow}
                  key={tickRow.tick.id}
                  readOnly={readOnly}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <MyTicksGraphs features={fetchedTicksToGraphFeatures(fetchedTicks)} />
    </>
  );
};

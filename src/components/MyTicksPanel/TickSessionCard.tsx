import React from 'react';
import { Box, Table, TableBody } from '@mui/material';
import { tint } from '../utils/panelUi';

export type TickColumn =
  | 'checkbox'
  | 'name'
  | 'grade'
  | 'style'
  | 'points'
  | 'date'
  | 'more'
  | 'add';

/** Trailing cell with a button or chip: tight padding so it fits its column. */
export const ACTION_CELL_CLASS = 'tick-action-cell';

// Fixed widths keep columns aligned from one session card to the next;
// the route name takes the rest.
const COLUMN_WIDTHS: Record<Exclude<TickColumn, 'name'>, number> = {
  // widths include the cell padding (8px each side, 16/12px at the edges)
  checkbox: 44,
  grade: 72, // fits a split grade like "8+/9-"
  style: 52,
  points: 56,
  date: 68,
  more: 52, // 40px icon button + 4/8px padding
  add: 104, // "Logged" chip + 4/12px padding
};

/** One climbing session (or a plain list): optional header + tick rows. */
export const TickSessionCard = ({
  header,
  columns,
  children,
}: {
  header?: React.ReactNode;
  columns: TickColumn[];
  children: React.ReactNode;
}) => (
  <Box
    component="section"
    sx={(theme) => ({
      // rows sit on the panel background; only the header is a surface
      bgcolor: 'background.default',
      border: `1px solid ${tint(theme, 0.08)}`,
      borderRadius: '12px',
      overflow: 'hidden',
    })}
  >
    {header}
    <Box sx={{ overflowX: 'auto' }}>
      <Table
        size="small"
        sx={{
          tableLayout: 'fixed',
          width: '100%',
          // Content keeps clear of the card edge, so the row hover never
          // runs into it: 16px on the left, 12px on the right.
          '& td': { px: 1, py: 0.75 },
          '& td:first-of-type': { pl: 2 },
          '& td:last-of-type': { pr: 1.5 },
          '& td.MuiTableCell-paddingCheckbox': { pl: 0.75, pr: 0 },
          [`& td.${ACTION_CELL_CLASS}`]: {
            pl: 0.5,
            pr: 1,
            textAlign: 'right',
            whiteSpace: 'nowrap',
          },
          '& tr:last-of-type > td': { borderBottom: 0 },
        }}
      >
        <colgroup>
          {columns.map((column) => (
            <col
              key={column}
              style={
                column === 'name' ? undefined : { width: COLUMN_WIDTHS[column] }
              }
            />
          ))}
        </colgroup>
        <TableBody>{children}</TableBody>
      </Table>
    </Box>
  </Box>
);

/** Row hover: a light wash on top of any row background (e.g. personal best). */
export const tickRowHoverSx = (theme) => ({
  '&:hover': {
    backgroundImage: `linear-gradient(${tint(theme, 0.035)}, ${tint(
      theme,
      0.035,
    )})`,
  },
});

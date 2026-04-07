import React from 'react';
import { Box, Typography } from '@mui/material';

type MonthlyDatum = { key: string; points: number };

function parseMonthKey(key: string): { year: string; month: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) {
    return { year: '', month: '' };
  }
  return { year: m[1], month: String(parseInt(m[2], 10)) };
}

function MonthlyPointsBarsBody({
  monthlySeries,
  maxMonthly,
}: {
  monthlySeries: MonthlyDatum[];
  maxMonthly: number;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 0.5,
        height: 112,
        pt: 1,
      }}
    >
      {monthlySeries.map(({ key, points }) => {
        const { year } = parseMonthKey(key);
        const yearNum = parseInt(year, 10);
        const isAltYear = Number.isFinite(yearNum) ? yearNum % 2 === 0 : false;
        const barH = points > 0 ? Math.max(8, (points / maxMonthly) * 100) : 2;
        return (
          <Box
            key={key}
            sx={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 0.5,
              borderRadius: 1,
              bgcolor: (theme) =>
                isAltYear ? theme.palette.action.hover : 'transparent',
            }}
            title={`${key}: ${points}`}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 28,
                height: `${barH}%`,
                bgcolor:
                  points > 0 ? 'primary.main' : 'action.disabledBackground',
                borderRadius: 0.5,
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

function MonthlyPointsMonthAxis({
  monthlySeries,
}: {
  monthlySeries: MonthlyDatum[];
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        mt: 0.5,
        justifyContent: 'space-between',
      }}
    >
      {monthlySeries.map(({ key }) => (
        <Typography
          key={`${key}-lbl`}
          variant="caption"
          color="text.secondary"
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: '0.6rem',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {parseMonthKey(key).month}
        </Typography>
      ))}
    </Box>
  );
}

function MonthlyPointsYearAxis({
  monthlySeries,
}: {
  monthlySeries: MonthlyDatum[];
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        mt: 0.25,
        justifyContent: 'space-between',
      }}
    >
      {monthlySeries.map(({ key }, i) => {
        const { year, month } = parseMonthKey(key);
        const prev = i > 0 ? parseMonthKey(monthlySeries[i - 1].key) : null;
        const showYear = i === 0 || (month === '1' && prev?.year !== year);
        return (
          <Typography
            key={`${key}-year`}
            variant="caption"
            color="text.secondary"
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: '0.55rem',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {showYear ? year : ''}
          </Typography>
        );
      })}
    </Box>
  );
}

export function UserProfileMonthlyPointsBars({
  monthlySeries,
  maxMonthly,
}: {
  monthlySeries: MonthlyDatum[];
  maxMonthly: number;
}) {
  return (
    <>
      <MonthlyPointsBarsBody
        monthlySeries={monthlySeries}
        maxMonthly={maxMonthly}
      />
      <MonthlyPointsMonthAxis monthlySeries={monthlySeries} />
      <MonthlyPointsYearAxis monthlySeries={monthlySeries} />
    </>
  );
}

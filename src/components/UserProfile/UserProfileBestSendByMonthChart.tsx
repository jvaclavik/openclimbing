import React from 'react';
import { Box, Typography } from '@mui/material';
import { t } from '../../services/intl';

type BestSendDatum = { key: string; gradeLabel: string; rowIndex: number };

function BestSendMonthBars({
  series,
  denom,
}: {
  series: BestSendDatum[];
  denom: number;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 0.5,
        height: 120,
        pt: 1,
      }}
    >
      {series.map(({ key, gradeLabel, rowIndex }) => {
        const has = rowIndex >= 0;
        const barH = has
          ? Math.max(12, ((rowIndex + 1) / (denom + 1)) * 100)
          : 2;
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
              gap: 0.25,
            }}
            title={
              has
                ? `${key}: ${gradeLabel}`
                : `${key}: ${t('user_profile.chart_no_send')}`
            }
          >
            {has ? (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  lineHeight: 1,
                  textAlign: 'center',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {gradeLabel}
              </Typography>
            ) : (
              <Box sx={{ height: 14 }} />
            )}
            <Box
              sx={{
                width: '100%',
                maxWidth: 28,
                height: `${barH}%`,
                bgcolor: has ? 'secondary.main' : 'action.disabledBackground',
                borderRadius: 0.5,
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

function BestSendMonthAxis({ series }: { series: BestSendDatum[] }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        mt: 0.5,
        justifyContent: 'space-between',
      }}
    >
      {series.map(({ key }) => (
        <Typography
          key={`${key}-bs`}
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
          {key.slice(2)}
        </Typography>
      ))}
    </Box>
  );
}

export function UserProfileBestSendByMonthChart({
  series,
  maxRowIndex,
}: {
  series: BestSendDatum[];
  maxRowIndex: number;
}) {
  const denom = Math.max(1, maxRowIndex);
  return (
    <Box>
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 700, mt: 2.5, mb: 0.75 }}
      >
        {t('user_profile.chart_best_send_month')}
      </Typography>
      <BestSendMonthBars series={series} denom={denom} />
      <BestSendMonthAxis series={series} />
    </Box>
  );
}

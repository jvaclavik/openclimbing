import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { intl, t } from '../../../services/intl';
import { TranslationId } from '../../../services/types';
import { tint } from '../../utils/panelUi';
import { STYLE_BUCKETS, StyleBucket } from './chartData';

// Ordinal ramp in the app's primary hue, cleanest style darkest (light mode)
// or brightest (dark mode). Validated for monotone lightness and contrast.
const STYLE_RAMP: Record<'light' | 'dark', Record<StyleBucket, string>> = {
  light: { os: '#6e1d07', fl: '#ae2f0c', rp: '#d9603a', other: '#e99678' },
  dark: { os: '#ffc2ad', fl: '#f37553', rp: '#c9502b', other: '#94361a' },
};

const STYLE_LABELS: Record<StyleBucket, TranslationId> = {
  os: 'user_profile.charts.style_os',
  fl: 'user_profile.charts.style_fl',
  rp: 'user_profile.charts.style_rp',
  other: 'user_profile.charts.style_other',
};

export const styleLabel = (bucket: StyleBucket) => t(STYLE_LABELS[bucket]);

export const useChartColors = () => {
  const theme = useTheme();
  return {
    mark: theme.palette.primary.main,
    surface: theme.palette.background.default,
    grid: tint(theme, 0.08),
    axisText: theme.palette.text.secondary,
    track: tint(theme, 0.05),
    styles: STYLE_RAMP[theme.palette.mode === 'dark' ? 'dark' : 'light'],
  };
};

export const AXIS_TICK_STYLE = { fontSize: 11 };

export const StyleLegend = () => {
  const { styles } = useChartColors();
  return (
    <Stack
      direction="row"
      sx={{ flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5 }}
      aria-hidden
    >
      {STYLE_BUCKETS.map((bucket) => (
        <Stack
          key={bucket}
          direction="row"
          spacing={0.6}
          sx={{ alignItems: 'center' }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '3px',
              bgcolor: styles[bucket],
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {styleLabel(bucket)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

const monthDate = (key: string) => new Date(`${key}-15T12:00:00`);

const formatter = (options: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat(intl.lang || 'en', options);
  } catch {
    return new Intl.DateTimeFormat('en', options);
  }
};

/** "led 2025" for tooltips. */
export const formatMonthKey = (key: string) =>
  formatter({ month: 'long', year: 'numeric' }).format(monthDate(key));

/** Axis label: month for short periods, year for long ones. */
export const monthAxisLabel = (key: string, long: boolean) =>
  long ? key.slice(0, 4) : formatter({ month: 'short' }).format(monthDate(key));

/** X ticks: Januaries for multi-year spans, every other month otherwise. */
export const monthAxisTicks = (keys: string[]): string[] => {
  if (keys.length <= 14) return keys.filter((_, i) => i % 2 === 0);
  const januaries = keys.filter((k) => k.endsWith('-01'));
  const step = Math.max(1, Math.ceil(januaries.length / 8));
  return januaries.filter((_, i) => i % step === 0);
};

export const ChartTooltipBox = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <Box
    sx={(theme) => ({
      px: 1.25,
      py: 0.75,
      borderRadius: '8px',
      bgcolor: 'background.paper',
      border: `1px solid ${tint(theme, 0.1)}`,
      boxShadow: theme.shadows[3],
      fontSize: 13,
    })}
  >
    {children}
  </Box>
);

export const ChartEmpty = () => (
  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
    {t('user_profile.charts.empty')}
  </Typography>
);

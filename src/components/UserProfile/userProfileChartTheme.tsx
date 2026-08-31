import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ResponsiveContainer } from 'recharts';

export const PROFILE_CHART_TITLE_SX = {
  fontWeight: 700,
  mt: 2.5,
  mb: 0.75,
} as const;

export function useRechartsTooltipTheme() {
  const theme = useTheme();
  return {
    contentStyle: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      color: theme.palette.text.primary,
    } as React.CSSProperties,
    labelStyle: { color: theme.palette.text.secondary } as React.CSSProperties,
    itemStyle: { color: theme.palette.text.primary } as React.CSSProperties,
  };
}

export function useRechartsAxisTheme() {
  const theme = useTheme();
  return {
    gridStroke: alpha(theme.palette.divider, 0.6),
    axisStroke: alpha(theme.palette.text.primary, 0.35),
    tickFill: theme.palette.text.secondary,
    legendWrapperStyle: {
      color: theme.palette.text.primary,
    } as React.CSSProperties,
  };
}

/**
 * Nadpis + volitelná poznámka + responzivní obal grafu. `children` musí být
 * jediný recharts graf (dostane 100 % šířky i výšky).
 */
export function ProfileChartSection({
  title,
  note,
  height,
  isFirstChart = false,
  children,
}: {
  title: string;
  note?: string;
  height: number;
  /** První graf v sekci — bez horního odsazení nadpisu. */
  isFirstChart?: boolean;
  children: React.ReactElement;
}) {
  return (
    <Box>
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{
          ...PROFILE_CHART_TITLE_SX,
          ...(isFirstChart ? { mt: 0 } : {}),
          ...(note ? { mb: 0 } : {}),
        }}
      >
        {title}
      </Typography>
      {note ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}
        >
          {note}
        </Typography>
      ) : null}
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

/**
 * Osa X pro dlouhé řady měsíců (`YYYY-MM`): značky jen u lednů, ať se roky
 * na mobilu nepřekrývají.
 */
export function yearTicksFromMonthKeys(
  keys: string[],
  maxTicks = 10,
): string[] {
  const januaries = keys.filter((k) => k.endsWith('-01'));
  // Kratší než dva roky: jen krajní měsíce, jinak by se rok opakoval u každého.
  const source =
    januaries.length >= 2
      ? januaries
      : [...new Set([keys[0], keys[keys.length - 1]].filter(Boolean))];
  if (source.length === 0) {
    return [];
  }
  if (source.length <= maxTicks) {
    return source;
  }
  const step = Math.ceil(source.length / maxTicks);
  return source.filter((_, i) => i % step === 0);
}

export function monthKeyToYearLabel(key: string): string {
  return String(key).slice(0, 4);
}

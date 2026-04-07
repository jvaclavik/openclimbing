import React from 'react';
import { Box, Typography } from '@mui/material';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { tickStyleToChartColor } from '../../services/my-ticks/ticks';
import type { GradeStyleSegment } from './userProfilePerformanceAggregates';
import { UserProfileGradeHistogramLabel } from './UserProfileGradeHistogramLabel';

function gradeSegmentsTooltip(
  grade: string,
  segments: GradeStyleSegment[],
): string {
  const parts = segments.map((s) => `${s.style ?? '—'}×${s.count}`);
  return `${grade}: ${parts.join(', ')}`;
}

type Row = {
  grade: string;
  total: number;
  segments: GradeStyleSegment[];
  sampleTick: FetchedClimbingTick | null;
};

export function UserProfileGradeHistogramBody({
  series,
  maxCount,
}: {
  series: Row[];
  maxCount: number;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {series.map((row, i) => {
        const wPct = Math.max(4, (row.total / maxCount) * 100);
        return (
          <Box
            key={`${row.grade}-${i}`}
            title={gradeSegmentsTooltip(row.grade, row.segments)}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 128,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  minHeight: 28,
                }}
              >
                <UserProfileGradeHistogramLabel
                  sampleTick={row.sampleTick}
                  gradeFallback={row.grade}
                />
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    height: 10,
                    width: `${wPct}%`,
                    maxWidth: '100%',
                    display: 'flex',
                    borderRadius: 0.5,
                    overflow: 'hidden',
                  }}
                >
                  {row.segments.map((seg, si) => (
                    <Box
                      key={`${row.grade}-seg-${si}-${String(seg.style)}`}
                      sx={{
                        flexGrow: seg.count,
                        flexBasis: 0,
                        minWidth: seg.count > 0 ? 2 : 0,
                        bgcolor: tickStyleToChartColor(seg.style),
                      }}
                    />
                  ))}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ flexShrink: 0 }}
                >
                  {row.total}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

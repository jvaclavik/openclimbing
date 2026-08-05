import React from 'react';
import { Tooltip } from '@mui/material';
import { useTheme } from '@emotion/react';
import { convertHexToRgba } from '../../utils/colorUtils';
import { t } from '../../../services/intl';

const SIZE = 14;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  total: number;
  withPhoto: number;
};

export const PhotoCoverageRing = ({ total, withPhoto }: Props) => {
  const theme = useTheme();
  if (!total) {
    return null;
  }

  const safeWithPhoto = Math.max(0, Math.min(withPhoto, total));
  const ratio = safeWithPhoto / total;
  const percent = Math.round(ratio * 100);

  const center = SIZE / 2;
  const accent = theme.palette.primary.main;
  // The track only exists so the ratio is readable, so instead of a second
  // colour competing with the accent it's a faint tint of the accent itself.
  // Dark surfaces swallow low-alpha strokes, hence the slightly higher value.
  const track = convertHexToRgba(
    accent,
    theme.palette.mode === 'dark' ? 0.24 : 0.16,
  );
  const label = t('photo_coverage.tooltip', {
    withPhoto: `${safeWithPhoto}`,
    total: `${total}`,
    percent: `${percent}`,
  });

  return (
    <Tooltip arrow enterDelay={700} enterNextDelay={700} title={label}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: 'block', flexShrink: 0 }}
        role="img"
        aria-label={label}
      >
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke={track}
          strokeWidth={STROKE}
        />
        {safeWithPhoto > 0 && (
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke={accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            // dashes draw the arc; the rotation moves its start to 12 o'clock
            strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </svg>
    </Tooltip>
  );
};

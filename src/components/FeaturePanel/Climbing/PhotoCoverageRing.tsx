import React from 'react';
import { Tooltip } from '@mui/material';
import { useTheme } from '@emotion/react';
import { convertHexToRgba } from '../../utils/colorUtils';
import { t } from '../../../services/intl';

const SIZE = 14;
const STROKE = 1.5;

const describeWedge = (cx: number, cy: number, r: number, ratio: number) => {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped <= 0) {
    return '';
  }
  if (clamped >= 1) {
    // Two arcs to draw a full circle as a single path.
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
      'Z',
    ].join(' ');
  }
  const angle = clamped * 2 * Math.PI;
  const endX = cx + r * Math.sin(angle);
  const endY = cy - r * Math.cos(angle);
  const largeArc = clamped > 0.5 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${cx} ${cy - r}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`,
    'Z',
  ].join(' ');
};

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

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const ringRadius = (SIZE - STROKE) / 2;
  const wedgeRadius = ringRadius - STROKE / 2;

  const accent = theme.palette.primary.main;
  const track = convertHexToRgba(theme.palette.secondary.main, 0.35);

  return (
    <Tooltip
      arrow
      enterDelay={700}
      enterNextDelay={700}
      title={t('photo_coverage.tooltip', {
        withPhoto: `${safeWithPhoto}`,
        total: `${total}`,
        percent: `${percent}`,
      })}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: 'block', flexShrink: 0 }}
        role="img"
        aria-label={t('photo_coverage.tooltip', {
          withPhoto: `${safeWithPhoto}`,
          total: `${total}`,
          percent: `${percent}`,
        })}
      >
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke={track}
          strokeWidth={STROKE}
        />
        {safeWithPhoto > 0 && (
          <path d={describeWedge(cx, cy, wedgeRadius, ratio)} fill={accent} />
        )}
      </svg>
    </Tooltip>
  );
};

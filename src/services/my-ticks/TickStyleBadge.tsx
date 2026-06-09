import { Box, Tooltip, alpha, darken, lighten } from '@mui/material';
import { TickStyle } from '../../components/FeaturePanel/Climbing/types';
import { tickStyles, tickStyleToChartColor } from './ticks';

type TickStyleBadgeProps = {
  style: TickStyle;
};

const NULL_LABEL = '—';

export const TickStyleBadge = ({ style }: TickStyleBadgeProps) => {
  const styleConfig = tickStyles.find((s) => s.key === style) ?? tickStyles[0];
  const baseColor = tickStyleToChartColor(style);
  const label = style != null ? style : NULL_LABEL;

  return (
    <Tooltip
      arrow
      enterDelay={400}
      title={
        <>
          <strong>{styleConfig.name}</strong>
          <p style={{ margin: 0 }}>{styleConfig.description}</p>
        </>
      }
    >
      <Box
        component="span"
        sx={(theme) => {
          const isDark = theme.palette.mode === 'dark';
          return {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '2.5em',
            height: '1.7em',
            px: 0.75,
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            cursor: 'help',
            color: isDark ? lighten(baseColor, 0.4) : darken(baseColor, 0.15),
            backgroundColor: alpha(baseColor, isDark ? 0.22 : 0.14),
            border: `1px solid ${alpha(baseColor, isDark ? 0.55 : 0.4)}`,
            transition: 'background-color 120ms, border-color 120ms',
          };
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );
};

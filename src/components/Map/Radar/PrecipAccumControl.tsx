import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useQuery } from 'react-query';
import WaterIcon from '@mui/icons-material/Water';
import {
  Badge,
  Box,
  IconButton,
  Slider,
  Stack,
  Switch,
  Theme,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { convertHexToRgba } from '../../utils/colorUtils';
import { getGlobalMap } from '../../../services/mapStorage';
import { GLASS_PAPER_SX, PopperWithArrow } from '../../utils/PopperWithArrow';
import { useMobileMode } from '../../helpers';
import { useMapStateContext } from '../../utils/MapStateContext';
import { useExclusiveMapControl } from '../mapControlsRegistry';
import {
  applyOverlay,
  isInRadarCoverage,
  MERGE_DATA_COORDINATES,
  removeOverlay,
} from './radarLayer';
import { PRECIP_SCALE } from './precipScale';

type Frame = { ts: string; time: string };

const IDS = { sourceId: 'chmu-accum', layerId: 'chmu-accum-layer' };
const HOUR_OPTIONS = [24, 48] as const;
type Hours = (typeof HOUR_OPTIONS)[number];

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $isOpened: boolean }>`
  pointer-events: all;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1); // same as LayerSwitcherButton
  backdrop-filter: blur(15px);

  background-color: ${({ theme, $isOpened }) =>
    $isOpened
      ? theme.palette.background.paper
      : convertHexToRgba(theme.palette.background.paper, 0.8)};

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }
`;

const Panel = styled.div`
  width: 260px;
  padding: 8px 12px 4px;
  pointer-events: all;
`;

const sliderSx = (theme: Theme) => {
  const color = theme.palette.primary.main;
  return {
    color,
    '& .MuiSlider-rail': {
      opacity: 1,
      backgroundColor: convertHexToRgba(color, 0.16),
    },
    '& .MuiSlider-track': {
      border: 'none',
      backgroundColor: convertHexToRgba(color, 0.45),
    },
    '& .MuiSlider-thumb': {
      width: 14,
      height: 14,
      boxShadow: `0 0 0 4px ${convertHexToRgba(color, 0.18)}`,
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0 0 0 6px ${convertHexToRgba(color, 0.24)}`,
      },
    },
  } as const;
};

const fetchFrames = async (): Promise<Frame[]> => {
  const res = await fetch('/api/radar-chmu-frames?product=merge1h');
  if (!res.ok) {
    throw new Error(`frames ${res.status}`);
  }
  const json = (await res.json()) as { frames: Frame[] };
  return json.frames ?? [];
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const accumUrl = (hours: Hours, ts: string) =>
  `/api/precip-accum?hours=${hours}&ts=${ts}`;

const LEGEND_LABELS = new Set([1, 10, 30, 60, 100, 150]);

const Legend = () => (
  <Box sx={{ mt: 1 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', mb: 0.5 }}
    >
      Úhrn [mm]
    </Typography>
    <Stack
      direction="row"
      sx={{ height: 10, borderRadius: 1, overflow: 'hidden' }}
    >
      {PRECIP_SCALE.map((stop) => (
        <Box
          key={stop.min}
          sx={{
            flex: 1,
            backgroundColor: `rgb(${stop.color[0]},${stop.color[1]},${stop.color[2]})`,
          }}
        />
      ))}
    </Stack>
    <Stack direction="row">
      {PRECIP_SCALE.map((stop) => (
        <Box key={stop.min} sx={{ flex: 1, textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: 9 }}
          >
            {LEGEND_LABELS.has(stop.min) ? stop.min : ''}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Box>
);

type ButtonProps = {
  open: boolean;
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
};

const AccumButton = ({ open, active, onClick }: ButtonProps) => {
  const isMobileMode = useMobileMode();
  return (
    <Badge color="success" variant="dot" overlap="circular" invisible={!active}>
      <Tooltip title="Úhrn srážek 24 / 48 h (ČHMÚ)" arrow>
        <StyledIconButton
          onClick={onClick}
          $isOpened={open}
          size={isMobileMode ? 'large' : 'medium'}
        >
          <WaterIcon fontSize="small" color={active ? 'primary' : 'inherit'} />
        </StyledIconButton>
      </Tooltip>
    </Badge>
  );
};

export const PrecipAccumControl = () => {
  const { view } = useMapStateContext();
  const [, latStr, lonStr] = view;
  const inCoverage = isInRadarCoverage(parseFloat(latStr), parseFloat(lonStr));

  const { open, toggle } = useExclusiveMapControl('accum');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hours, setHours] = useState<Hours>(24);
  const [opacity, setOpacity] = useState(0.8);

  const active = enabled && inCoverage;

  const { data: frames, isLoading } = useQuery(
    ['chmu-frames', 'merge1h'],
    fetchFrames,
    {
      enabled: active,
      refetchInterval: 60_000,
      staleTime: 60_000,
    },
  );

  const latest = frames?.length ? frames[frames.length - 1] : undefined;

  const hoursRef = useRef(hours);
  hoursRef.current = hours;
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;
  const tsRef = useRef<string | undefined>(latest?.ts);
  tsRef.current = latest?.ts;

  // Add/remove on toggle, and re-add after a base-layer switch wipes the style.
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !active) {
      return undefined;
    }
    const reapply = () => {
      const ts = tsRef.current;
      if (ts) {
        applyOverlay(
          map,
          IDS,
          accumUrl(hoursRef.current, ts),
          MERGE_DATA_COORDINATES,
          opacityRef.current,
        );
      }
    };
    map.on('styledata', reapply);
    reapply();
    return () => {
      map.off('styledata', reapply);
      removeOverlay(map, IDS);
    };
  }, [active]);

  // Swap image when the window (hours), latest frame or opacity changes.
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !active || !latest) {
      return;
    }
    applyOverlay(
      map,
      IDS,
      accumUrl(hours, latest.ts),
      MERGE_DATA_COORDINATES,
      opacity,
    );
  }, [active, hours, latest, opacity]);

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    toggle();
  };

  if (!inCoverage) {
    return null;
  }

  return (
    <>
      <AccumButton open={open} active={enabled} onClick={handleToggle} />
      <PopperWithArrow
        title="Úhrn srážek"
        isOpen={open}
        anchorEl={anchorEl}
        placement="top-end"
        offset={[0, 10]}
        paperSx={GLASS_PAPER_SX}
        addition={
          <Switch
            size="small"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            sx={{ mr: 1 }}
          />
        }
      >
        <Box sx={{ p: 1, pt: 0.5, pointerEvents: 'all' }}>
          {!enabled ? (
            <Typography variant="caption" sx={{ pl: 1 }}>
              Zapni úhrn srážek přepínačem vpravo nahoře.
            </Typography>
          ) : (
            <Panel>
              <ToggleButtonGroup
                size="small"
                exclusive
                fullWidth
                color="primary"
                value={hours}
                onChange={(_, v: Hours | null) => v && setHours(v)}
                sx={{ mb: 1 }}
              >
                {HOUR_OPTIONS.map((h) => (
                  <ToggleButton key={h} value={h}>
                    {h} h
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {isLoading || !latest ? (
                <Typography variant="caption" color="text.secondary">
                  Načítám data srážek…
                </Typography>
              ) : (
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                >
                  <Typography variant="body2" fontWeight={700} color="primary">
                    Úhrn za {hours} h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    k {formatDateTime(latest.time)}
                  </Typography>
                </Stack>
              )}

              <Legend />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                Průhlednost
              </Typography>
              <Slider
                size="small"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(_, v) => setOpacity(v as number)}
                sx={sliderSx}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Data © ČHMÚ · úhrn srážek · Česko a okolí
              </Typography>
            </Panel>
          )}
        </Box>
      </PopperWithArrow>
    </>
  );
};

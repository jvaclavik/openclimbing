import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  Badge,
  Box,
  Button,
  IconButton,
  Slider,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMapStateContext } from '../../utils/MapStateContext';
import { convertHexToRgba } from '../../utils/colorUtils';
import { getGlobalMap } from '../../../services/mapStorage';
import { GLASS_PAPER_SX, PopperWithArrow } from '../../utils/PopperWithArrow';
import { useMobileMode } from '../../helpers';
import { applySunShadow, getSunTimes, removeSunShadow } from './sunShadow';

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
  width: 240px;
  padding: 4px 8px 0;
`;

const QUICK_BTN_SX = {
  minWidth: 0,
  px: 0.75,
  py: 0.1,
  fontSize: '0.7rem',
  lineHeight: 1.4,
  textTransform: 'none',
} as const;

const QuickButton: React.FC<{ onClick: () => void; label: string }> = ({
  onClick,
  label,
}) => (
  <Button size="small" sx={QUICK_BTN_SX} onClick={onClick}>
    {label}
  </Button>
);

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const todayIso = () => {
  const d = new Date();
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
};

const buildDate = (isoDay: string, minutes: number) => {
  const [y, mo, d] = isoDay.split('-').map(Number);
  return new Date(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60);
};

const dateToMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

type SunMark = { value: number; label: React.ReactNode };

const MARK_ICON_SX = { fontSize: 13, verticalAlign: 'middle' } as const;
const MARK_ARROW_SX = { fontSize: 11, verticalAlign: 'middle' } as const;

const sunriseLabel = (
  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
    <ArrowUpwardIcon sx={MARK_ARROW_SX} />
    <WbSunnyIcon sx={MARK_ICON_SX} />
  </Box>
);
const noonLabel = <WbSunnyIcon sx={MARK_ICON_SX} />;
const sunsetLabel = (
  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
    <WbSunnyIcon sx={MARK_ICON_SX} />
    <ArrowDownwardIcon sx={MARK_ARROW_SX} />
  </Box>
);

type SunControlsProps = {
  day: string;
  setDay: (v: string) => void;
  minutes: number;
  setMinutes: (v: number) => void;
  setNow: () => void;
  onMorning: () => void;
  onAfternoon: () => void;
  marks: SunMark[];
  min: number;
  max: number;
};

const SunControls: React.FC<SunControlsProps> = ({
  day,
  setDay,
  minutes,
  setMinutes,
  setNow,
  onMorning,
  onAfternoon,
  marks,
  min,
  max,
}) => (
  <Panel>
    <input
      type="date"
      value={day}
      onChange={(e) => setDay(e.target.value)}
      style={{
        background: 'transparent',
        color: 'inherit',
        border: 'none',
        fontSize: '0.8rem',
        marginBottom: 4,
      }}
    />
    <Slider
      size="small"
      min={min}
      max={max}
      step={5}
      value={Math.min(Math.max(minutes, min), max)}
      marks={marks}
      valueLabelDisplay="auto"
      valueLabelFormat={formatMinutes}
      onChange={(_, v) => setMinutes(v as number)}
      sx={{
        '& .MuiSlider-markLabel': { fontSize: '0.65rem' },
        '& .MuiSlider-mark': { height: 8, width: 2 },
      }}
    />
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mt: 0.5 }}
    >
      <Stack direction="row" gap={0.5}>
        <QuickButton label="Dopoledne" onClick={onMorning} />
        <QuickButton label="Odpoledne" onClick={onAfternoon} />
      </Stack>
      <QuickButton label="Teď" onClick={setNow} />
    </Stack>
  </Panel>
);

const useSunQuickActions = (
  day: string,
  lat: number,
  lon: number,
  setMinutes: (v: number) => void,
) => {
  const sunTimes = useMemo(() => {
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    const times = getSunTimes(buildDate(day, 720), lat, lon);
    const toMin = (d: Date): number | null =>
      d && !Number.isNaN(d.getTime()) ? dateToMinutes(d) : null;
    return {
      sunrise: toMin(times.sunrise),
      noon: toMin(times.solarNoon),
      sunset: toMin(times.sunset),
    };
  }, [day, lat, lon]);

  const marks = useMemo<SunMark[]>(() => {
    if (!sunTimes) return [];
    const entries: [number | null, React.ReactNode][] = [
      [sunTimes.sunrise, sunriseLabel],
      [sunTimes.noon, noonLabel],
      [sunTimes.sunset, sunsetLabel],
    ];
    return entries
      .filter(([v]) => v !== null)
      .map(([v, label]) => ({ value: v as number, label }));
  }, [sunTimes]);

  // Slider spans sunrise → sunset (before/after isn't relevant for shadows).
  const range = useMemo(() => {
    const min = sunTimes?.sunrise ?? 5 * 60;
    const max = sunTimes?.sunset ?? 21 * 60;
    return max > min ? { min, max } : { min: 0, max: 1439 };
  }, [sunTimes]);

  // "Dopoledne" = halfway between sunrise and solar noon.
  const onMorning = () => {
    if (sunTimes?.sunrise != null && sunTimes?.noon != null) {
      setMinutes(Math.round((sunTimes.sunrise + sunTimes.noon) / 2));
    }
  };

  // "Odpoledne" = halfway between solar noon and sunset.
  const onAfternoon = () => {
    if (sunTimes?.noon != null && sunTimes?.sunset != null) {
      setMinutes(Math.round((sunTimes.noon + sunTimes.sunset) / 2));
    }
  };

  return { marks, range, onMorning, onAfternoon };
};

const useSunHillshadeEffect = (
  enabled: boolean,
  day: string,
  minutes: number,
  latLonRef: React.MutableRefObject<{ lat: number; lon: number }>,
) => {
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !enabled) {
      return undefined;
    }

    const reapply = () => {
      const date = buildDate(day, minutes);
      const { lat, lon } = latLonRef.current;
      applySunShadow(map, date, lat, lon);
    };

    // setStyle() (e.g. switching base layer) wipes our custom layer,
    // so re-add it whenever the style finishes (re)loading.
    map.on('styledata', reapply);
    reapply();

    return () => {
      map.off('styledata', reapply);
      removeSunShadow(map);
    };
  }, [enabled, day, minutes, latLonRef]);
};

type ShadowButtonProps = {
  open: boolean;
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
};

const ShadowButton = ({ open, active, onClick }: ShadowButtonProps) => {
  const isMobileMode = useMobileMode();
  return (
    <Badge color="success" variant="dot" overlap="circular" invisible={!active}>
      <Tooltip title="Mapa stínů (slunce)" arrow>
        <StyledIconButton
          onClick={onClick}
          $isOpened={open}
          size={isMobileMode ? 'large' : 'medium'}
        >
          <WbSunnyIcon
            fontSize="small"
            color={active ? 'primary' : 'inherit'}
          />
        </StyledIconButton>
      </Tooltip>
    </Badge>
  );
};

type ShadowPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  controls: React.ReactNode;
};

const ShadowPopover = ({
  open,
  anchorEl,
  enabled,
  setEnabled,
  controls,
}: ShadowPopoverProps) => (
  <PopperWithArrow
    title="Stíny"
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
      {enabled ? (
        controls
      ) : (
        <Typography variant="caption" sx={{ pl: 1 }}>
          Zapni stíny přepínačem vpravo nahoře.
        </Typography>
      )}
    </Box>
  </PopperWithArrow>
);

export const SunShadow = () => {
  const { view } = useMapStateContext();
  const [, latStr, lonStr] = view;
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState(todayIso);
  const [minutes, setMinutes] = useState(nowMinutes);

  const latLonRef = useRef({ lat, lon });
  latLonRef.current = { lat, lon };

  useSunHillshadeEffect(enabled, day, minutes, latLonRef);

  const { marks, range, onMorning, onAfternoon } = useSunQuickActions(
    day,
    lat,
    lon,
    setMinutes,
  );

  // Keep the time within the daylight range the slider exposes.
  useEffect(() => {
    if (minutes < range.min || minutes > range.max) {
      setMinutes(Math.min(Math.max(minutes, range.min), range.max));
    }
  }, [range, minutes]);

  const setNow = () => {
    setDay(todayIso());
    setMinutes(Math.min(Math.max(nowMinutes(), range.min), range.max));
  };

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen((o) => !o);
  };

  return (
    <>
      <ShadowButton open={open} active={enabled} onClick={handleToggle} />
      <ShadowPopover
        open={open}
        anchorEl={anchorEl}
        enabled={enabled}
        setEnabled={setEnabled}
        controls={
          <SunControls
            day={day}
            setDay={setDay}
            minutes={minutes}
            setMinutes={setMinutes}
            setNow={setNow}
            onMorning={onMorning}
            onAfternoon={onAfternoon}
            marks={marks}
            min={range.min}
            max={range.max}
          />
        }
      />
    </>
  );
};

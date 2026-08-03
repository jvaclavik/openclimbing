import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from '@emotion/styled';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  Badge,
  Box,
  Button,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Slider,
  Stack,
  Switch,
  Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMapStateContext } from '../../utils/MapStateContext';
import { convertHexToRgba } from '../../utils/colorUtils';
import { getGlobalMap } from '../../../services/mapStorage';
import { t } from '../../../services/intl';
import { GLASS_PAPER_SX, PopperWithArrow } from '../../utils/PopperWithArrow';
import { useMobileMode } from '../../helpers';
import { useExclusiveMapControl } from '../mapControlsRegistry';
import {
  applySunShadow,
  getSunTimes,
  removeSunShadow,
  SHADOW_MIN_ZOOM,
} from './sunShadowLayer';

const MapControlButton = styled(IconButton, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $isOpened: boolean }>`
  pointer-events: all;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(15px);

  background-color: ${({ theme, $isOpened }) =>
    $isOpened
      ? theme.palette.background.paper
      : convertHexToRgba(theme.palette.background.paper, 0.8)};

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }
`;

const Panel = styled.div<{ $inset?: boolean }>`
  width: 240px;
  padding: ${({ $inset }) => ($inset ? '0 16px 8px 52px' : '4px 8px 0')};
`;

const DateInput = styled.input`
  background: transparent;
  color: inherit;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  font-size: 0.8rem;
  width: 100%;
  padding: 2px 0 5px;
  cursor: pointer;
  transition: border-color 0.15s ease;
  // Make the browser render the native date popup (and its glyph) in the
  // matching light/dark scheme.
  color-scheme: ${({ theme }) => theme.palette.mode};

  &:focus {
    outline: none;
    border-bottom-color: #f5a623;
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.7;
  }
  &:hover::-webkit-calendar-picker-indicator {
    opacity: 1;
  }
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

// Snap slider movement to whole 10-minute marks (14:10, 14:20, …) while letting
// the two ends rest exactly on sunrise/sunset.
const snapToTen = (value: number, min: number, max: number) => {
  if (value <= min) return min;
  if (value >= max) return max;
  return Math.min(max, Math.max(min, Math.round(value / 10) * 10));
};

type SunMark = { value: number; label: React.ReactNode };

// Warm "sun" amber used to tie the slider, marks and labels together.
const SUN_COLOR = '#f5a623';

const MARK_ICON_SX = {
  fontSize: 13,
  verticalAlign: 'middle',
  color: SUN_COLOR,
} as const;
const MARK_ARROW_SX = {
  fontSize: 11,
  verticalAlign: 'middle',
  color: SUN_COLOR,
  opacity: 0.8,
} as const;

const SUN_SLIDER_SX = {
  color: SUN_COLOR,
  mt: 1.5,
  '& .MuiSlider-rail': {
    opacity: 1,
    backgroundColor: convertHexToRgba(SUN_COLOR, 0.16),
  },
  '& .MuiSlider-track': {
    border: 'none',
    backgroundColor: convertHexToRgba(SUN_COLOR, 0.45),
  },
  '& .MuiSlider-thumb': {
    width: 14,
    height: 14,
    boxShadow: `0 0 0 4px ${convertHexToRgba(SUN_COLOR, 0.18)}`,
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0 0 0 6px ${convertHexToRgba(SUN_COLOR, 0.24)}`,
    },
    '&.Mui-active': {
      boxShadow: `0 0 0 8px ${convertHexToRgba(SUN_COLOR, 0.28)}`,
    },
  },
  // Sunrise / noon / sunset ticks: solid amber and tall enough to stick out
  // above the rail so they stay visible over the filled track too.
  '& .MuiSlider-mark': {
    backgroundColor: SUN_COLOR,
    height: 13,
    width: 2,
    borderRadius: 1,
    opacity: 1,
  },
  '& .MuiSlider-markActive': {
    backgroundColor: SUN_COLOR,
    opacity: 1,
  },
  '& .MuiSlider-markLabel': { fontSize: '0.65rem' },
  '& .MuiSlider-valueLabel': {
    backgroundColor: SUN_COLOR,
    color: 'rgba(0, 0, 0, 0.82)',
    fontWeight: 600,
  },
} as const;

const WARNING_BOX_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  mb: 1,
  px: 1,
  py: 0.6,
  borderRadius: 1,
  color: 'warning.main',
  bgcolor: (theme: Theme) => convertHexToRgba(theme.palette.warning.main, 0.16),
  border: (theme: Theme) =>
    `1px solid ${convertHexToRgba(theme.palette.warning.main, 0.4)}`,
} as const;

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
  lowZoom: boolean;
  inset?: boolean;
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
  lowZoom,
  inset,
}) => (
  <Panel $inset={inset}>
    {lowZoom && (
      <Box sx={WARNING_BOX_SX}>
        <WarningAmberIcon sx={{ fontSize: 17, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          Přibliž mapu, aby se stíny zobrazily.
        </Typography>
      </Box>
    )}
    <DateInput
      type="date"
      value={day}
      onChange={(e) => setDay(e.target.value)}
    />
    <Slider
      size="small"
      min={min}
      max={max}
      step={10}
      value={Math.min(Math.max(minutes, min), max)}
      marks={marks}
      valueLabelDisplay="auto"
      valueLabelFormat={formatMinutes}
      onChange={(_, v) => setMinutes(snapToTen(v as number, min, max))}
      sx={SUN_SLIDER_SX}
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
  const onMorning = useCallback(() => {
    if (sunTimes?.sunrise != null && sunTimes?.noon != null) {
      setMinutes(Math.round((sunTimes.sunrise + sunTimes.noon) / 2));
    }
  }, [sunTimes, setMinutes]);

  // "Odpoledne" = halfway between solar noon and sunset.
  const onAfternoon = useCallback(() => {
    if (sunTimes?.noon != null && sunTimes?.sunset != null) {
      setMinutes(Math.round((sunTimes.noon + sunTimes.sunset) / 2));
    }
  }, [sunTimes, setMinutes]);

  return { marks, range, onMorning, onAfternoon };
};

const useSunHillshadeEffect = (
  enabled: boolean,
  day: string,
  minutes: number,
  latLonRef: React.MutableRefObject<{ lat: number; lon: number }>,
) => {
  // Keep the latest time available to the style-reload handler without making it
  // part of the add/remove effect's dependencies.
  const timeRef = useRef({ day, minutes });
  timeRef.current = { day, minutes };

  // Add/remove the custom layer only when toggled on/off (or the style reloads).
  // Doing this on every time change would tear the layer down and reload the DEM
  // from scratch, which is exactly the flash we want to avoid.
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !enabled) {
      return undefined;
    }

    const reapply = () => {
      const { day: d, minutes: m } = timeRef.current;
      const { lat, lon } = latLonRef.current;
      applySunShadow(map, buildDate(d, m), lat, lon);
    };

    // setStyle() (e.g. switching base layer) wipes our custom layer,
    // so re-add it whenever the style finishes (re)loading.
    map.on('styledata', reapply);
    reapply();

    return () => {
      map.off('styledata', reapply);
      removeSunShadow(map);
    };
  }, [enabled, latLonRef]);

  // On a time change just update the sun on the existing layer: it repaints the
  // shadows in place (no DEM reload), so there's no flicker.
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !enabled) return;
    const { lat, lon } = latLonRef.current;
    applySunShadow(map, buildDate(day, minutes), lat, lon);
  }, [enabled, day, minutes, latLonRef]);
};

const useLowZoom = (enabled: boolean) => {
  const [lowZoom, setLowZoom] = useState(false);
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !enabled) {
      setLowZoom(false);
      return undefined;
    }
    const update = () => setLowZoom(map.getZoom() < SHADOW_MIN_ZOOM);
    update();
    map.on('zoom', update);
    return () => {
      map.off('zoom', update);
    };
  }, [enabled]);
  return lowZoom;
};

type SunShadowContextValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
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
  lowZoom: boolean;
};

const SunShadowContext = createContext<SunShadowContextValue | null>(null);

const useSunShadowContext = () => {
  const ctx = useContext(SunShadowContext);
  if (!ctx) {
    throw new Error('SunShadowPanel must be used within SunShadowProvider');
  }
  return ctx;
};

/** Keeps shadow layer effects alive while the layer-switcher drawer is closed. */
export const SunShadowProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { view } = useMapStateContext();
  const [, latStr, lonStr] = view;
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState(todayIso);
  const [minutes, setMinutes] = useState(nowMinutes);

  const latLonRef = useRef({ lat, lon });
  latLonRef.current = { lat, lon };

  useSunHillshadeEffect(enabled, day, minutes, latLonRef);
  const lowZoom = useLowZoom(enabled);

  const { marks, range, onMorning, onAfternoon } = useSunQuickActions(
    day,
    lat,
    lon,
    setMinutes,
  );

  useEffect(() => {
    if (minutes < range.min || minutes > range.max) {
      setMinutes(Math.min(Math.max(minutes, range.min), range.max));
    }
  }, [range, minutes]);

  const setNow = useCallback(() => {
    setDay(todayIso());
    setMinutes(Math.min(Math.max(nowMinutes(), range.min), range.max));
  }, [range.min, range.max]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      day,
      setDay,
      minutes,
      setMinutes,
      setNow,
      onMorning,
      onAfternoon,
      marks,
      min: range.min,
      max: range.max,
      lowZoom,
    }),
    [
      enabled,
      day,
      minutes,
      setNow,
      onMorning,
      onAfternoon,
      marks,
      range.min,
      range.max,
      lowZoom,
    ],
  );

  return (
    <SunShadowContext.Provider value={value}>
      {children}
    </SunShadowContext.Provider>
  );
};

/** Toggle only – settings live on the map icon once enabled. */
export const SunShadowPanel = () => {
  const { enabled, setEnabled } = useSunShadowContext();

  return (
    <ListItemButton onClick={() => setEnabled(!enabled)} sx={{ py: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 45 }}>
        <WbSunnyIcon fontSize="small" color={enabled ? 'primary' : 'inherit'} />
      </ListItemIcon>
      <ListItemText primary={t('layerswitcher.shadows')} />
      <Switch
        edge="end"
        size="small"
        checked={enabled}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setEnabled(e.target.checked)}
      />
    </ListItemButton>
  );
};

/** Floating map control – only while shadows are on. */
export const SunShadowMapButton = () => {
  const isMobileMode = useMobileMode();
  const { open, toggle, setOpen } = useExclusiveMapControl('shadow');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const {
    enabled,
    setEnabled,
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
    lowZoom,
  } = useSunShadowContext();

  if (!enabled) return null;

  const hiddenByZoom = lowZoom;

  return (
    <>
      <Badge
        color="success"
        variant="dot"
        overlap="circular"
        invisible={hiddenByZoom}
      >
        <Tooltip
          title={
            hiddenByZoom
              ? 'Přibliž mapu, aby se stíny zobrazily'
              : t('layerswitcher.shadows')
          }
          arrow
        >
          <MapControlButton
            $isOpened={open}
            size={isMobileMode ? 'large' : 'medium'}
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
              toggle();
            }}
          >
            {hiddenByZoom ? (
              <WarningAmberIcon fontSize="small" color="warning" />
            ) : (
              <WbSunnyIcon fontSize="small" color="primary" />
            )}
          </MapControlButton>
        </Tooltip>
      </Badge>
      <PopperWithArrow
        title={t('layerswitcher.shadows')}
        isOpen={open}
        anchorEl={anchorEl}
        placement="top-end"
        offset={[0, 10]}
        paperSx={GLASS_PAPER_SX}
        addition={
          <Switch
            size="small"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              if (!e.target.checked) setOpen(false);
            }}
            sx={{ mr: 1 }}
          />
        }
      >
        <Box sx={{ p: 1, pt: 0.5, pointerEvents: 'all' }}>
          <SunControls
            day={day}
            setDay={setDay}
            minutes={minutes}
            setMinutes={setMinutes}
            setNow={setNow}
            onMorning={onMorning}
            onAfternoon={onAfternoon}
            marks={marks}
            min={min}
            max={max}
            lowZoom={lowZoom}
          />
        </Box>
      </PopperWithArrow>
    </>
  );
};

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
  CircularProgress,
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
import { MapControlAppear } from '../MapControlAppear';
import {
  applySunShadow,
  getSunTimes,
  removeSunShadow,
  SHADOW_MIN_ZOOM,
  subscribeSunShadowLoading,
} from './sunShadowLayer';

const SUN_COLOR = '#f5a623';

const MapControlButton = styled(IconButton, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $isOpened: boolean }>`
  pointer-events: all;
  position: relative;
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
  width: 248px;
  padding: ${({ $inset }) => ($inset ? '0 16px 10px 52px' : '8px 12px 10px')};
`;

const DateInput = styled.input`
  background: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.05)'};
  color: inherit;
  border: 1px solid
    ${({ theme }) =>
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(0, 0, 0, 0.18)'};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  width: 100%;
  padding: 8px 10px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  color-scheme: ${({ theme }) => theme.palette.mode};

  &:hover {
    border-color: ${({ theme }) =>
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.32)'
        : 'rgba(0, 0, 0, 0.32)'};
  }

  &:focus {
    outline: none;
    border-color: ${SUN_COLOR};
    box-shadow: 0 0 0 3px ${convertHexToRgba(SUN_COLOR, 0.22)};
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.85;
  }
`;

const QUICK_BTN_SX = {
  minWidth: 0,
  px: 1,
  py: 0.25,
  fontSize: '0.72rem',
  lineHeight: 1.4,
  fontWeight: 700,
  textTransform: 'none',
  borderRadius: '999px',
} as const;

const QuickButton: React.FC<{
  onClick: () => void;
  label: string;
  emphasized?: boolean;
}> = ({ onClick, label, emphasized }) => (
  <Button
    size="small"
    variant={emphasized ? 'contained' : 'outlined'}
    onClick={onClick}
    sx={{
      ...QUICK_BTN_SX,
      ...(emphasized
        ? {
            backgroundColor: SUN_COLOR,
            color: 'rgba(0, 0, 0, 0.82)',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: SUN_COLOR,
              filter: 'brightness(0.95)',
            },
          }
        : {
            color: 'text.primary',
            borderColor: (theme: Theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.28)'
                : 'rgba(0, 0, 0, 0.28)',
          }),
    }}
  >
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
  '& .MuiSlider-markLabel': {
    fontSize: '0.7rem',
    color: 'text.primary',
    filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.35))',
  },
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
          {t('layerswitcher.shadows_zoom_in')}
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
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 0.5,
      }}
    >
      <Stack
        direction="row"
        sx={{
          gap: 0.5,
        }}
      >
        <QuickButton
          label={t('layerswitcher.shadows_morning')}
          onClick={onMorning}
        />
        <QuickButton
          label={t('layerswitcher.shadows_afternoon')}
          onClick={onAfternoon}
        />
      </Stack>
      <QuickButton
        label={t('layerswitcher.shadows_now')}
        onClick={setNow}
        emphasized
      />
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

    map.on('styledata', reapply);
    if (map.isStyleLoaded()) {
      reapply();
    } else {
      map.once('idle', reapply);
    }

    return () => {
      map.off('styledata', reapply);
      map.off('idle', reapply);
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

const useSunShadowLoading = (enabled: boolean) => {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    return subscribeSunShadowLoading(setLoading);
  }, [enabled]);
  return enabled && loading;
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
  isLoading: boolean;
};

const SunShadowContext = createContext<SunShadowContextValue | null>(null);

let enableSunShadow: (() => void) | null = null;
let pendingOpenPopover = false;

const SHADOW_PREVIEW_ZOOM = SHADOW_MIN_ZOOM + 1;

/** Turn shadows on from outside the provider (e.g. About page CTA). */
export const activateSunShadow = () => {
  const apply = () => {
    pendingOpenPopover = true;
    enableSunShadow?.();
    const map = getGlobalMap();
    if (!map || map.getZoom() >= SHADOW_MIN_ZOOM) return;
    map.easeTo({ zoom: SHADOW_PREVIEW_ZOOM, duration: 1200, essential: true });
  };
  window.setTimeout(apply, 0);
};

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

  useEffect(() => {
    enableSunShadow = () => setEnabled(true);
    return () => {
      enableSunShadow = null;
    };
  }, []);

  const latLonRef = useRef({ lat, lon });
  latLonRef.current = { lat, lon };

  useSunHillshadeEffect(enabled, day, minutes, latLonRef);
  const lowZoom = useLowZoom(enabled);
  const isLoading = useSunShadowLoading(enabled && !lowZoom);

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
      isLoading,
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
      isLoading,
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
  const buttonRef = useRef<HTMLButtonElement>(null);
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
    isLoading,
  } = useSunShadowContext();

  useEffect(() => {
    if (!enabled || !pendingOpenPopover) return;
    pendingOpenPopover = false;
    const el = buttonRef.current;
    if (!el) return;
    setAnchorEl(el);
    setOpen(true);
  }, [enabled, setOpen]);

  if (!enabled) return null;

  const hiddenByZoom = lowZoom;

  return (
    <>
      <MapControlAppear id="shadow">
        <Badge
          color={hiddenByZoom ? 'error' : 'success'}
          variant="dot"
          overlap="circular"
          invisible={isLoading && !hiddenByZoom}
        >
          <Tooltip
            title={
              hiddenByZoom
                ? t('layerswitcher.shadows_zoom_in')
                : t('layerswitcher.shadows')
            }
            arrow
          >
            <MapControlButton
              ref={buttonRef}
              $isOpened={open}
              size={isMobileMode ? 'large' : 'medium'}
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                toggle();
              }}
            >
              {isLoading && (
                <CircularProgress
                  size={isMobileMode ? 36 : 28}
                  thickness={4}
                  sx={{ position: 'absolute', inset: 0, margin: 'auto' }}
                />
              )}
              <WbSunnyIcon fontSize="small" color="primary" />
            </MapControlButton>
          </Tooltip>
        </Badge>
      </MapControlAppear>
      <PopperWithArrow
        title={t('layerswitcher.shadows')}
        isOpen={open}
        anchorEl={anchorEl}
        placement="top-end"
        offset={[0, 10]}
        paperSx={GLASS_PAPER_SX}
        loading={isLoading}
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

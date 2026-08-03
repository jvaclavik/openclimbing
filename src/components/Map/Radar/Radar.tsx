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
import { useQuery } from 'react-query';
import RadarIcon from '@mui/icons-material/Radar';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import {
  Badge,
  Box,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Slider,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { convertHexToRgba } from '../../utils/colorUtils';
import { getGlobalMap } from '../../../services/mapStorage';
import { useMapStateContext } from '../../utils/MapStateContext';
import { t } from '../../../services/intl';
import { GLASS_PAPER_SX, PopperWithArrow } from '../../utils/PopperWithArrow';
import { useMobileMode } from '../../helpers';
import { useExclusiveMapControl } from '../mapControlsRegistry';
import { applyRadar, isInRadarCoverage, removeRadar } from './radarLayer';

type RadarFrame = { ts: string; time: string };

const RADAR_COLOR = '#f5a623';
const FRAME_INTERVAL_MS = 450;
const DEFAULT_OPACITY = 0.75;

const Panel = styled.div<{ $inset?: boolean }>`
  width: 260px;
  padding: ${({ $inset }) => ($inset ? '0 16px 8px 52px' : '8px 12px 4px')};
  pointer-events: all;
`;

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

const RADAR_SLIDER_SX = {
  color: RADAR_COLOR,
  '& .MuiSlider-rail': {
    opacity: 1,
    backgroundColor: convertHexToRgba(RADAR_COLOR, 0.16),
  },
  '& .MuiSlider-track': {
    border: 'none',
    backgroundColor: convertHexToRgba(RADAR_COLOR, 0.45),
  },
  '& .MuiSlider-thumb': {
    width: 14,
    height: 14,
    boxShadow: `0 0 0 4px ${convertHexToRgba(RADAR_COLOR, 0.18)}`,
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0 0 0 6px ${convertHexToRgba(RADAR_COLOR, 0.24)}`,
    },
  },
} as const;

const fetchFrames = async (): Promise<RadarFrame[]> => {
  const res = await fetch('/api/radar-chmu-frames');
  if (!res.ok) {
    throw new Error(`frames ${res.status}`);
  }
  const json = (await res.json()) as { frames: RadarFrame[] };
  return json.frames ?? [];
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type RadarControlsProps = {
  frames: RadarFrame[] | undefined;
  isLoading: boolean;
  index: number;
  setIndex: (v: number) => void;
  playing: boolean;
  togglePlay: () => void;
  opacity: number;
  setOpacity: (v: number) => void;
  inset?: boolean;
};

const RadarControls = ({
  frames,
  isLoading,
  index,
  setIndex,
  playing,
  togglePlay,
  opacity,
  setOpacity,
  inset,
}: RadarControlsProps) => {
  if (isLoading || !frames) {
    return (
      <Panel $inset={inset}>
        <Typography variant="caption" color="text.secondary">
          Načítám radarová data…
        </Typography>
      </Panel>
    );
  }

  if (!frames.length) {
    return (
      <Panel $inset={inset}>
        <Typography variant="caption" color="text.secondary">
          Radarová data se nepodařilo načíst.
        </Typography>
      </Panel>
    );
  }

  const current = frames[Math.min(index, frames.length - 1)];
  const isLatest = index >= frames.length - 1;

  return (
    <Panel $inset={inset}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={playing ? 'Zastavit' : 'Přehrát'} arrow>
          <IconButton
            size="small"
            onClick={togglePlay}
            sx={{ color: RADAR_COLOR }}
          >
            {playing ? (
              <PauseIcon fontSize="small" />
            ) : (
              <PlayArrowIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Slider
          size="small"
          min={0}
          max={frames.length - 1}
          step={1}
          value={Math.min(index, frames.length - 1)}
          onChange={(_, v) => setIndex(v as number)}
          sx={RADAR_SLIDER_SX}
        />
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
      >
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ color: RADAR_COLOR }}
        >
          {formatTime(current.time)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isLatest
            ? 'poslední snímek'
            : `−${(frames.length - 1 - index) * 5} min`}
        </Typography>
      </Stack>

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
        sx={RADAR_SLIDER_SX}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 0.5 }}
      >
        Data © ČHMÚ · pokrytí Česko a okolí
      </Typography>
    </Panel>
  );
};

type RadarContextValue = {
  inCoverage: boolean;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  frames: RadarFrame[] | undefined;
  isLoading: boolean;
  index: number;
  onSliderIndex: (v: number) => void;
  playing: boolean;
  togglePlay: () => void;
  opacity: number;
  setOpacity: (v: number) => void;
};

const RadarContext = createContext<RadarContextValue | null>(null);

const useRadarContext = () => {
  const ctx = useContext(RadarContext);
  if (!ctx) {
    throw new Error('RadarPanel must be used within RadarProvider');
  }
  return ctx;
};

/** Keeps radar overlay effects alive while the layer-switcher drawer is closed. */
export const RadarProvider = ({ children }: { children: React.ReactNode }) => {
  const { view } = useMapStateContext();
  const [, latStr, lonStr] = view;
  const inCoverage = isInRadarCoverage(parseFloat(latStr), parseFloat(lonStr));

  const [enabled, setEnabled] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [followLatest, setFollowLatest] = useState(true);

  const active = enabled && inCoverage;

  const { data: frames, isLoading } = useQuery(
    ['chmu-radar-frames'],
    fetchFrames,
    {
      enabled: active,
      refetchInterval: 60_000,
      staleTime: 60_000,
    },
  );

  const framesRef = useRef<RadarFrame[] | undefined>(frames);
  framesRef.current = frames;
  const indexRef = useRef(index);
  indexRef.current = index;
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;

  useEffect(() => {
    if (frames?.length && followLatest) {
      setIndex(frames.length - 1);
    }
  }, [frames, followLatest]);

  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !active) {
      return undefined;
    }
    const reapply = () => {
      const f = framesRef.current;
      if (f?.length) {
        const i = Math.min(indexRef.current, f.length - 1);
        applyRadar(map, f[i].ts, opacityRef.current);
      }
    };
    map.on('styledata', reapply);
    reapply();
    return () => {
      map.off('styledata', reapply);
      removeRadar(map);
    };
  }, [active]);

  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !active || !frames?.length) {
      return;
    }
    applyRadar(map, frames[Math.min(index, frames.length - 1)].ts, opacity);
  }, [active, frames, index, opacity]);

  useEffect(() => {
    if (!playing || !active || !frames?.length) {
      return undefined;
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, active, frames]);

  // Leaving the coverage area should not leave a stale overlay behind.
  useEffect(() => {
    if (!inCoverage && enabled) {
      setEnabled(false);
      setPlaying(false);
    }
  }, [inCoverage, enabled]);

  const onSliderIndex = useCallback(
    (v: number) => {
      setPlaying(false);
      setFollowLatest(frames ? v >= frames.length - 1 : true);
      setIndex(v);
    },
    [frames],
  );

  const togglePlay = useCallback(() => {
    if (!playing && frames?.length && index >= frames.length - 1) {
      setIndex(0);
    }
    setFollowLatest(false);
    setPlaying((p) => !p);
  }, [playing, frames, index]);

  const value = useMemo(
    () => ({
      inCoverage,
      enabled,
      setEnabled,
      frames,
      isLoading,
      index,
      onSliderIndex,
      playing,
      togglePlay,
      opacity,
      setOpacity,
    }),
    [
      inCoverage,
      enabled,
      frames,
      isLoading,
      index,
      onSliderIndex,
      playing,
      togglePlay,
      opacity,
    ],
  );

  return (
    <RadarContext.Provider value={value}>{children}</RadarContext.Provider>
  );
};

/** Toggle only – settings live on the map icon once enabled. */
export const RadarPanel = () => {
  const { inCoverage, enabled, setEnabled } = useRadarContext();

  if (!inCoverage) {
    return (
      <ListItemButton disabled sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: 45 }}>
          <RadarIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={t('layerswitcher.radar')}
          secondary={t('layerswitcher.radar_unavailable')}
        />
      </ListItemButton>
    );
  }

  return (
    <ListItemButton onClick={() => setEnabled(!enabled)} sx={{ py: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 45 }}>
        <RadarIcon fontSize="small" color={enabled ? 'primary' : 'inherit'} />
      </ListItemIcon>
      <ListItemText primary={t('layerswitcher.radar')} />
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

/** Floating map control – only while radar is on and in coverage. */
export const RadarMapButton = () => {
  const isMobileMode = useMobileMode();
  const { open, toggle, setOpen } = useExclusiveMapControl('radar');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const {
    inCoverage,
    enabled,
    setEnabled,
    frames,
    isLoading,
    index,
    onSliderIndex,
    playing,
    togglePlay,
    opacity,
    setOpacity,
  } = useRadarContext();

  if (!enabled || !inCoverage) return null;

  return (
    <>
      <Badge color="success" variant="dot" overlap="circular">
        <Tooltip title={t('layerswitcher.radar')} arrow>
          <MapControlButton
            $isOpened={open}
            size={isMobileMode ? 'large' : 'medium'}
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
              toggle();
            }}
          >
            <RadarIcon fontSize="small" color="primary" />
          </MapControlButton>
        </Tooltip>
      </Badge>
      <PopperWithArrow
        title={t('layerswitcher.radar')}
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
          <RadarControls
            frames={frames}
            isLoading={isLoading}
            index={index}
            setIndex={onSliderIndex}
            playing={playing}
            togglePlay={togglePlay}
            opacity={opacity}
            setOpacity={setOpacity}
          />
        </Box>
      </PopperWithArrow>
    </>
  );
};

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from '@emotion/styled';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import ExploreIcon from '@mui/icons-material/Explore';
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
  Tooltip,
  Typography,
} from '@mui/material';
import { convertHexToRgba } from '../../utils/colorUtils';
import { getGlobalMap } from '../../../services/mapStorage';
import { t } from '../../../services/intl';
import { GLASS_PAPER_SX, PopperWithArrow } from '../../utils/PopperWithArrow';
import { useMobileMode } from '../../helpers';
import { useExclusiveMapControl } from '../mapControlsRegistry';
import { MapControlAppear } from '../MapControlAppear';
import { useMapSourceLoading } from '../useMapSourceLoading';
import { useMapStateContext } from '../../utils/MapStateContext';
import {
  enableTerrain3d,
  PREVIEW_MIN_ZOOM,
  PREVIEW_PITCH,
  PREVIEW_ZOOM,
  setTerrain3dWanted,
  turnOffTerrain,
} from '../behaviour/useToggleTerrainControl';

const TERRAIN_COLOR = '#00897b';

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

const Panel = styled.div`
  width: 248px;
  padding: 8px 12px 10px;
  pointer-events: all;
`;

const Pad = styled.div`
  position: relative;
  width: 168px;
  height: 168px;
  margin: 2px auto 10px;
  border-radius: 18px;
  touch-action: none;
  cursor: grab;
  user-select: none;
  overflow: visible;
  background: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.04)'};
  border: 1px solid
    ${({ theme }) =>
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.08)'};

  &:active {
    cursor: grabbing;
  }
`;

const Stage = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 280px;
`;

const Plane = styled.div`
  width: 92px;
  height: 92px;
  border-radius: 12px;
  transform-origin: center center;
  transform-style: preserve-3d;
  will-change: transform;
  background: linear-gradient(
    160deg,
    ${convertHexToRgba(TERRAIN_COLOR, 0.55)} 0%,
    ${convertHexToRgba(TERRAIN_COLOR, 0.18)} 100%
  );
  border: 1px solid ${convertHexToRgba(TERRAIN_COLOR, 0.45)};
  box-shadow:
    0 10px 24px ${convertHexToRgba(TERRAIN_COLOR, 0.28)},
    0 1px 0 rgba(255, 255, 255, 0.25) inset;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
`;

const North = styled.span`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #e53935;
  line-height: 1;
`;

const SLIDER_SX = {
  color: TERRAIN_COLOR,
  '& .MuiSlider-rail': {
    opacity: 1,
    backgroundColor: convertHexToRgba(TERRAIN_COLOR, 0.16),
  },
  '& .MuiSlider-track': {
    border: 'none',
    backgroundColor: convertHexToRgba(TERRAIN_COLOR, 0.45),
  },
  '& .MuiSlider-thumb': {
    width: 14,
    height: 14,
    boxShadow: `0 0 0 4px ${convertHexToRgba(TERRAIN_COLOR, 0.18)}`,
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0 0 0 6px ${convertHexToRgba(TERRAIN_COLOR, 0.24)}`,
    },
  },
} as const;

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

const wrapBearing = (value: number) => {
  let bearing = value;
  while (bearing > 180) bearing -= 360;
  while (bearing < -180) bearing += 360;
  return bearing;
};

const clampPitch = (value: number) => Math.min(85, Math.max(0, value));

const planeTransform = (pitch: number, bearing: number) =>
  `rotateX(${pitch * 0.82}deg) rotateZ(${-bearing}deg)`;

let cameraRaf = 0;
let pendingCamera: { pitch: number; bearing: number } | null = null;

const jumpCamera = (pitch: number, bearing: number) => {
  pendingCamera = { pitch: clampPitch(pitch), bearing: wrapBearing(bearing) };
  if (cameraRaf) return;
  cameraRaf = requestAnimationFrame(() => {
    cameraRaf = 0;
    flushCamera();
  });
};

const flushCamera = () => {
  if (cameraRaf) {
    cancelAnimationFrame(cameraRaf);
    cameraRaf = 0;
  }
  const next = pendingCamera;
  pendingCamera = null;
  const map = getGlobalMap();
  if (!map || !next) return;
  map.jumpTo({ pitch: next.pitch, bearing: next.bearing });
};

const ViewPad = ({
  pitch,
  bearing,
  onCamera,
  onDragChange,
}: {
  pitch: number;
  bearing: number;
  onCamera: (pitch: number, bearing: number) => void;
  onDragChange: (dragging: boolean) => void;
}) => {
  const planeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    pitch: number;
    bearing: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    getGlobalMap()?.stop();
    onDragChange(true);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      pitch,
      bearing,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    if (!start) return;
    const nextPitch = clampPitch(start.pitch - (e.clientY - start.y) * 0.45);
    const nextBearing = wrapBearing(
      start.bearing + (e.clientX - start.x) * 0.6,
    );
    if (planeRef.current) {
      planeRef.current.style.transform = planeTransform(nextPitch, nextBearing);
    }
    jumpCamera(nextPitch, nextBearing);
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    flushCamera();
    const map = getGlobalMap();
    if (map) onCamera(map.getPitch(), map.getBearing());
    onDragChange(false);
  };

  useLayoutEffect(() => {
    if (!planeRef.current || dragRef.current) return;
    planeRef.current.style.transform = planeTransform(pitch, bearing);
  }, [pitch, bearing]);

  return (
    <Pad
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <Stage>
        <Plane ref={planeRef}>
          <North>N</North>
        </Plane>
      </Stage>
    </Pad>
  );
};

const TerrainControls = ({
  pitch,
  bearing,
  onCamera,
  onDragChange,
}: {
  pitch: number;
  bearing: number;
  onCamera: (pitch: number, bearing: number) => void;
  onDragChange: (dragging: boolean) => void;
}) => {
  const resetNorth = () => {
    const map = getGlobalMap();
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 500, essential: true });
  };

  return (
    <Panel>
      <ViewPad
        pitch={pitch}
        bearing={bearing}
        onCamera={onCamera}
        onDragChange={onDragChange}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mb: 1, mt: -0.5 }}
      >
        {t('layerswitcher.3d_hint')}
      </Typography>
      <Stack spacing={0.25}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
        >
          <Typography variant="caption" fontWeight={700}>
            {t('layerswitcher.3d_tilt')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(pitch)}°
          </Typography>
        </Stack>
        <Slider
          size="small"
          min={0}
          max={85}
          value={pitch}
          onChange={(_, v) => onCamera(v as number, bearing)}
          sx={SLIDER_SX}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
          sx={{ mt: 0.5 }}
        >
          <Typography variant="caption" fontWeight={700}>
            {t('layerswitcher.3d_rotate')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(bearing)}°
          </Typography>
        </Stack>
        <Slider
          size="small"
          min={-180}
          max={180}
          value={bearing}
          onChange={(_, v) => onCamera(pitch, v as number)}
          sx={SLIDER_SX}
        />
      </Stack>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.75 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ExploreIcon sx={{ fontSize: 16 }} />}
          onClick={resetNorth}
          sx={QUICK_BTN_SX}
        >
          {t('layerswitcher.3d_reset_north')}
        </Button>
      </Stack>
    </Panel>
  );
};

type Terrain3dContextValue = {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
};

const Terrain3dContext = createContext<Terrain3dContextValue | null>(null);

let enableTerrain3dUi: (() => void) | null = null;
let pendingOpenPopover = false;

const tiltMap = () => {
  const map = getGlobalMap();
  if (!map) return;
  enableTerrain3d(map);
  const tooFar = map.getZoom() < PREVIEW_MIN_ZOOM;
  map.easeTo({
    pitch: PREVIEW_PITCH,
    ...(tooFar ? { zoom: PREVIEW_ZOOM } : {}),
    duration: 1400,
    essential: true,
  });
};

/** Pitch + terrain from outside React (e.g. About page CTA). */
export const activateTerrain3dPreview = () => {
  const apply = () => {
    pendingOpenPopover = true;
    enableTerrain3dUi?.();
    const map = getGlobalMap();
    if (!map) return;
    if (map.isStyleLoaded()) {
      tiltMap();
      return;
    }
    map.once('idle', tiltMap);
  };
  window.setTimeout(apply, 0);
};

const useTerrain3dContext = () => {
  const ctx = useContext(Terrain3dContext);
  if (!ctx) {
    throw new Error('Terrain3dPanel must be used within Terrain3dProvider');
  }
  return ctx;
};

const useCamera = (enabled: boolean) => {
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const draggingRef = useRef(false);
  const uiRaf = useRef(0);
  const pendingUi = useRef<{ pitch: number; bearing: number } | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const map = getGlobalMap();
    if (!map) return undefined;

    const sync = () => {
      if (draggingRef.current) return;
      setPitch(map.getPitch());
      setBearing(map.getBearing());
    };
    map.on('pitch', sync);
    map.on('rotate', sync);
    sync();
    return () => {
      map.off('pitch', sync);
      map.off('rotate', sync);
    };
  }, [enabled]);

  const setCamera = useCallback((nextPitch: number, nextBearing: number) => {
    const pitchValue = clampPitch(nextPitch);
    const bearingValue = wrapBearing(nextBearing);
    pendingUi.current = { pitch: pitchValue, bearing: bearingValue };
    jumpCamera(pitchValue, bearingValue);
    if (uiRaf.current) return;
    uiRaf.current = requestAnimationFrame(() => {
      uiRaf.current = 0;
      const next = pendingUi.current;
      pendingUi.current = null;
      if (!next) return;
      setPitch(next.pitch);
      setBearing(next.bearing);
    });
  }, []);

  const onDragChange = useCallback((dragging: boolean) => {
    draggingRef.current = dragging;
    if (dragging) return;
    const map = getGlobalMap();
    if (!map) return;
    setPitch(map.getPitch());
    setBearing(map.getBearing());
  }, []);

  return { pitch, bearing, setCamera, onDragChange };
};

export const Terrain3dProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { mapLoaded } = useMapStateContext();
  const [enabled, setEnabled] = useState(false);
  const wasEnabled = useRef(false);
  const flatteningRef = useRef(false);

  const setEnabledSafe = useCallback((next: boolean) => {
    if (!next) flatteningRef.current = true;
    else flatteningRef.current = false;
    setEnabled(next);
  }, []);

  useEffect(() => {
    enableTerrain3dUi = () => setEnabledSafe(true);
    return () => {
      enableTerrain3dUi = null;
    };
  }, [setEnabledSafe]);

  useEffect(() => {
    setTerrain3dWanted(enabled);
    if (!mapLoaded) return undefined;
    const map = getGlobalMap();
    if (!map) return undefined;
    let cancelled = false;

    if (enabled) {
      wasEnabled.current = true;
      flatteningRef.current = false;
      const apply = () => {
        if (cancelled) return;
        enableTerrain3d(map);
        if (!pendingOpenPopover && map.getPitch() < 5) {
          map.easeTo({
            pitch: PREVIEW_PITCH,
            duration: 900,
            essential: true,
          });
        }
      };
      if (map.isStyleLoaded()) apply();
      else map.once('idle', apply);
      return () => {
        cancelled = true;
        map.off('idle', apply);
      };
    }

    if (!wasEnabled.current) return undefined;
    wasEnabled.current = false;
    flatteningRef.current = true;
    const finishFlatten = () => {
      flatteningRef.current = false;
    };
    try {
      if (map.getPitch() > 0) {
        map.easeTo({ pitch: 0, duration: 500, essential: true });
        map.once('pitchend', finishFlatten);
      } else {
        finishFlatten();
      }
      turnOffTerrain(map);
    } catch {
      finishFlatten();
    }
    return () => {
      cancelled = true;
      map.off('pitchend', finishFlatten);
    };
  }, [enabled, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return undefined;
    const map = getGlobalMap();
    if (!map) return undefined;

    const maybeEnable = () => {
      if (flatteningRef.current) return;
      if (map.getPitch() > 5) setEnabled(true);
    };

    map.on('pitch', maybeEnable);
    return () => {
      map.off('pitch', maybeEnable);
    };
  }, [mapLoaded]);

  const value = useMemo(
    () => ({ enabled, setEnabled: setEnabledSafe }),
    [enabled, setEnabledSafe],
  );

  return (
    <Terrain3dContext.Provider value={value}>
      {children}
    </Terrain3dContext.Provider>
  );
};

export const Terrain3dPanel = () => {
  const { enabled, setEnabled } = useTerrain3dContext();

  return (
    <ListItemButton onClick={() => setEnabled(!enabled)} sx={{ py: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 45 }}>
        <ThreeDRotationIcon
          fontSize="small"
          color={enabled ? 'primary' : 'inherit'}
        />
      </ListItemIcon>
      <ListItemText primary={t('layerswitcher.3d')} />
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

export const Terrain3dMapButton = () => {
  const isMobileMode = useMobileMode();
  const { open, toggle, setOpen } = useExclusiveMapControl('terrain');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { enabled, setEnabled } = useTerrain3dContext();
  const { pitch, bearing, setCamera, onDragChange } = useCamera(enabled);
  const isLoading = useMapSourceLoading('terrain3d', enabled);

  useEffect(() => {
    if (!enabled || !pendingOpenPopover) return;
    pendingOpenPopover = false;
    const el = buttonRef.current;
    if (!el) return;
    setAnchorEl(el);
    setOpen(true);
  }, [enabled, setOpen]);

  if (!enabled) return null;

  return (
    <>
      <MapControlAppear>
        <Badge
          color="success"
          variant="dot"
          overlap="circular"
          invisible={isLoading}
        >
          <Tooltip title={t('layerswitcher.3d')} arrow>
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
              <ThreeDRotationIcon fontSize="small" color="primary" />
            </MapControlButton>
          </Tooltip>
        </Badge>
      </MapControlAppear>
      <PopperWithArrow
        title={t('layerswitcher.3d')}
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
          <TerrainControls
            pitch={pitch}
            bearing={bearing}
            onCamera={setCamera}
            onDragChange={onDragChange}
          />
        </Box>
      </PopperWithArrow>
    </>
  );
};

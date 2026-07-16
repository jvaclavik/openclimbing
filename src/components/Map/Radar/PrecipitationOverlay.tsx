import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useQuery } from 'react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import {
  Badge,
  Box,
  IconButton,
  Slider,
  Stack,
  Switch,
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
  overlayFrameUrl,
  RADAR_COORDINATES,
  removeOverlay,
} from './radarLayer';
import type { PrecipProduct } from './precipitationProducts';

type Frame = { ts: string; time: string };

const FRAME_INTERVAL_MS = 450;

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

const sliderSx = (color: string) =>
  ({
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
  }) as const;

const fetchFrames = async (product: string): Promise<Frame[]> => {
  const res = await fetch(`/api/radar-chmu-frames?product=${product}`);
  if (!res.ok) {
    throw new Error(`frames ${res.status}`);
  }
  const json = (await res.json()) as { frames: Frame[] };
  return json.frames ?? [];
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type OverlayButtonProps = {
  product: PrecipProduct;
  open: boolean;
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
};

const OverlayButton = ({
  product,
  open,
  active,
  onClick,
}: OverlayButtonProps) => {
  const isMobileMode = useMobileMode();
  const Icon = product.icon;
  return (
    <Badge color="success" variant="dot" overlap="circular" invisible={!active}>
      <Tooltip title={product.buttonTooltip} arrow>
        <StyledIconButton
          onClick={onClick}
          $isOpened={open}
          size={isMobileMode ? 'large' : 'medium'}
        >
          <Icon fontSize="small" color={active ? 'primary' : 'inherit'} />
        </StyledIconButton>
      </Tooltip>
    </Badge>
  );
};

type OverlayControlsProps = {
  product: PrecipProduct;
  frames: Frame[] | undefined;
  isLoading: boolean;
  index: number;
  setIndex: (v: number) => void;
  playing: boolean;
  togglePlay: () => void;
  opacity: number;
  setOpacity: (v: number) => void;
};

const OverlayControls = ({
  product,
  frames,
  isLoading,
  index,
  setIndex,
  playing,
  togglePlay,
  opacity,
  setOpacity,
}: OverlayControlsProps) => {
  const sx = sliderSx(product.color);

  if (isLoading || !frames) {
    return (
      <Panel>
        <Typography variant="caption" color="text.secondary">
          {product.loadingText}
        </Typography>
      </Panel>
    );
  }

  if (!frames.length) {
    return (
      <Panel>
        <Typography variant="caption" color="text.secondary">
          {product.emptyText}
        </Typography>
      </Panel>
    );
  }

  const current = frames[Math.min(index, frames.length - 1)];
  const isLatest = index >= frames.length - 1;

  return (
    <Panel>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Tooltip title={playing ? 'Zastavit' : 'Přehrát'} arrow>
          <IconButton
            size="small"
            onClick={togglePlay}
            sx={{ color: product.color }}
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
          sx={sx}
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
          sx={{ color: product.color }}
        >
          {formatTime(current.time)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isLatest
            ? product.latestLabel
            : `−${(frames.length - 1 - index) * product.stepMinutes} min`}
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
        sx={sx}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 0.5 }}
      >
        {product.footer}
      </Typography>
    </Panel>
  );
};

type Props = {
  product: PrecipProduct;
};

export const PrecipitationOverlay = ({ product }: Props) => {
  const { view } = useMapStateContext();
  const [, latStr, lonStr] = view;
  const inCoverage = isInRadarCoverage(parseFloat(latStr), parseFloat(lonStr));

  const { open, toggle } = useExclusiveMapControl(product.controlId);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [opacity, setOpacity] = useState(product.defaultOpacity);
  const [followLatest, setFollowLatest] = useState(true);

  // Only draw / fetch while the button is actually offered (map centre in range).
  const active = enabled && inCoverage;

  const { data: frames, isLoading } = useQuery(
    ['chmu-frames', product.key],
    () => fetchFrames(product.key),
    {
      enabled: active,
      refetchInterval: 60_000,
      staleTime: 60_000,
    },
  );

  // Keep the newest values reachable from the style-reload handler without
  // re-subscribing on every change.
  const framesRef = useRef<Frame[] | undefined>(frames);
  framesRef.current = frames;
  const indexRef = useRef(index);
  indexRef.current = index;
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;

  // Jump to the latest frame whenever the list refreshes, unless the user has
  // scrubbed back in time.
  useEffect(() => {
    if (frames?.length && followLatest) {
      setIndex(frames.length - 1);
    }
  }, [frames, followLatest]);

  // Add/remove the overlay on toggle and re-add it after a base-layer switch
  // (setStyle wipes custom sources/layers).
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !active) {
      return undefined;
    }
    const reapply = () => {
      const f = framesRef.current;
      if (f?.length) {
        const i = Math.min(indexRef.current, f.length - 1);
        applyOverlay(
          map,
          product.ids,
          overlayFrameUrl(product.key, f[i].ts),
          RADAR_COORDINATES,
          opacityRef.current,
        );
      }
    };
    map.on('styledata', reapply);
    reapply();
    return () => {
      map.off('styledata', reapply);
      removeOverlay(map, product.ids);
    };
  }, [active, product]);

  // Swap the frame / opacity in place (no flicker) when they change.
  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !active || !frames?.length) {
      return;
    }
    applyOverlay(
      map,
      product.ids,
      overlayFrameUrl(
        product.key,
        frames[Math.min(index, frames.length - 1)].ts,
      ),
      RADAR_COORDINATES,
      opacity,
    );
  }, [active, frames, index, opacity, product]);

  // Animation loop.
  useEffect(() => {
    if (!playing || !active || !frames?.length) {
      return undefined;
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, active, frames]);

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    toggle();
  };

  const onSliderIndex = (v: number) => {
    setPlaying(false);
    setFollowLatest(frames ? v >= frames.length - 1 : true);
    setIndex(v);
  };

  const togglePlay = () => {
    // Restart from the beginning if we're parked on the last frame.
    if (!playing && frames?.length && index >= frames.length - 1) {
      setIndex(0);
    }
    setFollowLatest(false);
    setPlaying((p) => !p);
  };

  // Data only covers Czechia and its surroundings – hide the control entirely
  // when the map is centred elsewhere.
  if (!inCoverage) {
    return null;
  }

  return (
    <>
      <OverlayButton
        product={product}
        open={open}
        active={enabled}
        onClick={handleToggle}
      />
      <PopperWithArrow
        title={product.popperTitle}
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
            <OverlayControls
              product={product}
              frames={frames}
              isLoading={isLoading}
              index={index}
              setIndex={onSliderIndex}
              playing={playing}
              togglePlay={togglePlay}
              opacity={opacity}
              setOpacity={setOpacity}
            />
          ) : (
            <Typography variant="caption" sx={{ pl: 1 }}>
              {product.enableHint}
            </Typography>
          )}
        </Box>
      </PopperWithArrow>
    </>
  );
};

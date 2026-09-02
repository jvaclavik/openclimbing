import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LayerIcon, Spacer, StyledList } from './helpers';
import { Layer, useMapStateContext } from '../utils/MapStateContext';
import { dotToOptionalBr } from '../helpers';
import { intl, t, Translation } from '../../services/intl';
import { TooltipButton } from '../utils/TooltipButton';
import { useQuery } from 'react-query';
import { CLIMBING_STATS_URL } from '../../services/climbing-areas/getClimbingStats';
import { fetchJson } from '../../services/fetch';
import type { ClimbingStatsResponse } from '../../types';
import { nl2br } from '../utils/nl2br';
import { AddUserLayerButton } from './AddLayerButton';

const getLocalTime = (lastRefresh: string) =>
  lastRefresh ? new Date(lastRefresh).toLocaleString(intl.lang) : null;

const fetchClimbingStats = () =>
  fetchJson<ClimbingStatsResponse>(CLIMBING_STATS_URL);

const ClimbingSecondaryInner = () => {
  const { data, error, isFetching } = useQuery([], () => fetchClimbingStats());

  if (isFetching) {
    return null;
  }

  if (error) {
    console.error('Error fetching climbing stats', error); // eslint-disable-line no-console
    return null;
  }

  const { lastRefresh, osmDataTimestamp, devStats } = data;
  const tooltip = (
    <>
      <Translation
        id="climbing_tiles.stats"
        values={{
          lastRefresh: getLocalTime(lastRefresh),
          osmTime: getLocalTime(osmDataTimestamp),
        }}
      />
      <br />
      <br />
      Dev stats:{' '}
      {nl2br(
        Object.entries(devStats)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n'),
      )}
      <br />
    </>
  );

  return (
    <>
      {getLocalTime(osmDataTimestamp).replace(/:\d+( [APM]+)?$/, '$1')}
      <TooltipButton
        sx={{ fontSize: '14px', margin: '-8px -3px -6px -3px' }}
        tooltip={tooltip}
      />
    </>
  );
};

const ClimbingSecondary = () => {
  if (process.env.NEXT_PUBLIC_ENABLE_CLIMBING_TILES) {
    return <ClimbingSecondaryInner />;
  }
  return <>lite</>;
};

const OverlayItem = ({ layer }: { layer: Layer }) => {
  const { activeLayers, setActiveLayers } = useMapStateContext();
  const { key, name, Icon } = layer;

  const handleClick = (e: React.MouseEvent) => {
    setActiveLayers((prev) =>
      prev.includes(key)
        ? prev.filter((layer) => layer !== key)
        : prev.concat(key),
    );
    e.stopPropagation();
  };
  const selected = activeLayers.includes(key);
  const secondary =
    key === 'climbing' && selected ? <ClimbingSecondary /> : undefined;

  return (
    <ListItemButton onClick={handleClick}>
      <LayerIcon Icon={Icon} />
      <ListItemText primary={dotToOptionalBr(name)} secondary={secondary} />
      <ListItemSecondaryAction>
        <Checkbox edge="end" checked={selected} onClick={handleClick} />
      </ListItemSecondaryAction>
    </ListItemButton>
  );
};

type Props = {
  overlayLayers: Layer[];
};

export const Overlays = ({ overlayLayers }: Props) => {
  const { activeLayers } = useMapStateContext();
  const { climbing, other } = useMemo(() => {
    const items = overlayLayers.filter((l) => l.type !== 'spacer');
    return {
      climbing: items.find((l) => l.key === 'climbing'),
      other: items.filter((l) => l.key !== 'climbing'),
    };
  }, [overlayLayers]);

  const otherActive = other.some((l) => activeLayers.includes(l.key));
  const [moreOpen, setMoreOpen] = useState(otherActive);

  useEffect(() => {
    if (otherActive) setMoreOpen(true);
  }, [otherActive]);

  return (
    <>
      <Typography
        variant="overline"
        color="textSecondary"
        style={{ padding: '1em 0 0 1em' }}
        sx={{
          display: 'block',
        }}
      >
        {t('layerswitcher.overlays')}
      </Typography>

      <StyledList dense suppressHydrationWarning>
        {climbing && <OverlayItem layer={climbing} />}
      </StyledList>

      <Accordion
        disableGutters
        elevation={0}
        expanded={moreOpen}
        onChange={(_, expanded) => setMoreOpen(expanded)}
        sx={{
          '&:before': { display: 'none' },
          bgcolor: 'transparent',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 40,
            px: 2,
            '& .MuiAccordionSummary-content': { my: 0.5 },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {t('layerswitcher.more_overlays')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pb: 1 }}>
          {other.length > 0 && (
            <StyledList dense suppressHydrationWarning>
              {other.map((layer) =>
                layer.type === 'spacer' ? (
                  <Spacer key={layer.key} />
                ) : (
                  <OverlayItem key={layer.key} layer={layer} />
                ),
              )}
            </StyledList>
          )}
          <AddUserLayerButton />
        </AccordionDetails>
      </Accordion>
    </>
  );
};

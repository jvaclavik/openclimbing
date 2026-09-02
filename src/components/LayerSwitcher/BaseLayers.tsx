import {
  Bbox,
  Layer,
  useMapStateContext,
  View,
} from '../utils/MapStateContext';
import {
  isViewInsideBbox,
  LayerIcon,
  RemoveUserLayerAction,
  StyledList,
} from './helpers';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import { t } from '../../services/intl';

/** Always visible in the layer list – the rest lives under “More maps”.
 *  `cuzkSat` is only in `baseLayers` while the view is over CZ (bbox filter). */
const FEATURED_ORDER = ['tourist', 'carto', 'sat', 'cuzkSat'] as const;

const OutsideOfView = () => (
  <Tooltip title="Not visible currently" arrow placement="top-end">
    <WarningIcon fontSize="small" color="secondary" />
  </Tooltip>
);

const getIsOutsideOfView = (bboxes: Bbox[], view: View) =>
  bboxes && !bboxes.some((b) => isViewInsideBbox(view, b));

const BaseLayerItem = ({ layer }: { layer: Layer }) => {
  const { view, activeLayers, setActiveLayers } = useMapStateContext();
  const { key, name, type, url, Icon, bboxes, secondLine } = layer;

  const handleClick = () => {
    setActiveLayers((prev) => [key, ...prev.slice(1)]);
  };
  const selected = activeLayers.includes(key);
  const isOutsideOfView = getIsOutsideOfView(bboxes, view);

  return (
    <ListItemButton selected={selected} onClick={handleClick}>
      <LayerIcon Icon={Icon} />
      <ListItemText
        primary={name}
        secondary={selected && secondLine ? secondLine : undefined}
      />
      {isOutsideOfView && <OutsideOfView />}
      {type === 'user' && <RemoveUserLayerAction url={url} />}
    </ListItemButton>
  );
};

const splitLayers = (baseLayers: Layer[]) => {
  const byKey = new Map(
    baseLayers.filter((l) => l.type !== 'spacer').map((l) => [l.key, l]),
  );
  const featured = FEATURED_ORDER.map((key) => byKey.get(key)).filter(
    Boolean,
  ) as Layer[];
  const featuredKeys = new Set(FEATURED_ORDER as readonly string[]);
  const more = baseLayers.filter(
    (l) => l.type !== 'spacer' && !featuredKeys.has(l.key),
  );
  return { featured, more };
};

export const BaseLayers = ({ baseLayers }: { baseLayers: Layer[] }) => {
  const { activeLayers } = useMapStateContext();
  const { featured, more } = useMemo(
    () => splitLayers(baseLayers),
    [baseLayers],
  );
  const activeInMore = more.some((l) => activeLayers.includes(l.key));
  const [moreOpen, setMoreOpen] = useState(activeInMore);

  useEffect(() => {
    if (activeInMore) setMoreOpen(true);
  }, [activeInMore]);

  return (
    <>
      <StyledList dense suppressHydrationWarning>
        {featured.map((layer) => (
          <BaseLayerItem key={layer.key} layer={layer} />
        ))}
      </StyledList>

      {more.length > 0 && (
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
              {t('layerswitcher.more_maps')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <StyledList dense suppressHydrationWarning>
              {more.map((layer) => (
                <BaseLayerItem key={layer.key} layer={layer} />
              ))}
            </StyledList>
          </AccordionDetails>
        </Accordion>
      )}
    </>
  );
};

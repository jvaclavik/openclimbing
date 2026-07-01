import React from 'react';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { isViewInsideBbox, LayersHeader, StyledList } from './helpers';
import { osmappLayers } from './osmappLayers';
import { Layer, useMapStateContext, View } from '../utils/MapStateContext';
import { Overlays } from './Overlays';
import { BaseLayers } from './BaseLayers';
import { Box, Divider, Typography } from '@mui/material';
import { t } from '../../services/intl';
import { SunShadowPanel } from '../Map/SunShadow/SunShadow';
import { RadarPanel } from '../Map/Radar/Radar';
import { PrecipAccumPanel } from '../Map/Radar/PrecipAccum';

type AllLayers = {
  basemapLayers: Layer[];
  overlayLayers: Layer[];
};

const getAllLayers = (userLayers: Layer[], view: View): AllLayers => {
  const spacer: Layer = { type: 'spacer' as const, key: 'userSpacer' };
  const toLayer = ([key, layer]) => ({ ...layer, key });

  const entries = Object.entries(osmappLayers).filter(([_, layer]) => {
    if (!layer.bboxes) return true;
    return layer.bboxes.some((b) => isViewInsideBbox(view, b));
  });
  const basemaps = entries.filter(([, v]) => v.type === 'basemap');
  const overlays = entries.filter(([, v]) => v.type.startsWith('overlay'));

  const basemapLayers = [
    ...basemaps.map(toLayer),
    ...(userLayers.length ? [spacer] : []),
    ...userLayers.map((layer) => ({
      ...layer,
      key: layer.url,
      Icon: PersonAdd,
    })),
  ];

  return {
    basemapLayers,
    overlayLayers: overlays.map(toLayer),
  };
};

const MapExtras = () => (
  <>
    <Box px={2} pt={1.5} pb={0.5}>
      <Typography variant="body2" color="text.secondary">
        {t('layerswitcher.extras')}
      </Typography>
    </Box>
    <StyledList dense>
      <SunShadowPanel />
      <RadarPanel />
      <PrecipAccumPanel />
    </StyledList>
  </>
);

export const LayerSwitcherContent = () => {
  const { view, userLayers } = useMapStateContext();
  const { basemapLayers, overlayLayers } = getAllLayers(userLayers, view);

  return (
    <>
      <LayersHeader />
      <Divider />

      <BaseLayers baseLayers={basemapLayers} />
      <Divider />
      <MapExtras />
      <Divider />
      <Overlays overlayLayers={overlayLayers} />
    </>
  );
};

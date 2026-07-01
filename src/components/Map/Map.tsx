import React from 'react';

import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import BugReport from '@mui/icons-material/BugReport';
import { Button, CircularProgress, Stack } from '@mui/material';
import { MapFooter } from './MapFooter/MapFooter';
import { SHOW_PROTOTYPE_UI } from '../../config.mjs';
import { LayerSwitcherButton } from '../LayerSwitcher/LayerSwitcherButton';
import { MaptilerLogo } from './MapFooter/MaptilerLogo';
import { useMapStateContext } from '../utils/MapStateContext';
import { MapFilter } from './MapFilter/MapFilter';
import { SunShadowMapButton, SunShadowProvider } from './SunShadow/SunShadow';
import { RadarMapButton, RadarProvider } from './Radar/Radar';
import { PrecipAccumMapButton, PrecipAccumProvider } from './Radar/PrecipAccum';
import { DRAWER_MOTION, QUARTER_PEEK_PX } from '../utils/drawerSnap';
import {
  BOTTOM_RIGHT_Z_DEFAULT,
  BOTTOM_RIGHT_Z_RAISED,
  useMapChrome,
} from '../utils/mapChromeRegistry';

const BrowserMapDynamic = dynamic(() => import('./BrowserMap'), {
  ssr: false,
  loading: () => <div />,
});

// These are client-only map overlays that render after the map has loaded and
// use maplibre-gl at runtime. Importing them lazily keeps maplibre-gl out of
// the shared _app bundle (it ships in the map's async chunk instead).
const MyListsLayer = dynamic(
  () => import('./MyListsLayer').then((m) => m.MyListsLayer),
  { ssr: false },
);
const CragPhotoMarkers = dynamic(
  () => import('./CragPhotoMarkers').then((m) => m.CragPhotoMarkers),
  { ssr: false },
);

const LayerSwitcherDynamic = dynamic(
  () => import('../LayerSwitcher/LayerSwitcher'),
  {
    ssr: false,
    loading: () => <LayerSwitcherButton />,
  },
);

const Spinner = styled(CircularProgress)`
  position: absolute;
  left: 50%;
  top: 50%;
  margin: -20px 0 0 -20px;
`;

const BottomLeft = styled.div`
  position: absolute;
  bottom: 0;
  pointer-events: none;
  z-index: 999;
  left: 0px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 0 4px 4px;
`;

const BottomRight = styled.div<{ $zIndex: number; $bottom: number }>`
  position: absolute;
  right: 6px;
  bottom: ${({ $bottom }) => $bottom}px;
  pointer-events: none;
  z-index: ${({ $zIndex }) => $zIndex};
  transition: bottom ${DRAWER_MOTION};

  // every control icon must receive clicks; parent is pointer-events: none
  & > * {
    pointer-events: all;
  }
`;

const BugReportButton = () => (
  <Button size="small">
    <BugReport width="10" height="10" />
    Nahlásit chybu v mapě
  </Button>
);

const NoscriptMessage = () => (
  <noscript>
    <span style={{ position: 'absolute', left: '50%', top: '50%' }}>
      This map needs Javascript.
    </span>
  </noscript>
);

const Map = () => {
  const { mapLoaded, activeLayers } = useMapStateContext();
  const hasClimbingLayer = activeLayers.includes('climbing');
  const { layersOpen, drawerPeek } = useMapChrome();

  return (
    <>
      <BrowserMapDynamic />
      {mapLoaded && <MyListsLayer />}
      {mapLoaded && <CragPhotoMarkers />}
      {!mapLoaded && <Spinner color="secondary" />}
      <NoscriptMessage />
      <BottomLeft>
        {SHOW_PROTOTYPE_UI && <BugReportButton />}
        <MaptilerLogo />
        <MapFooter />
      </BottomLeft>
      {/* providers only wrap controls that need them – pan/zoom must not re-render the map tree */}
      <SunShadowProvider>
        <RadarProvider>
          <PrecipAccumProvider>
            <BottomRight
              $zIndex={
                layersOpen ? BOTTOM_RIGHT_Z_RAISED : BOTTOM_RIGHT_Z_DEFAULT
              }
              $bottom={drawerPeek ? QUARTER_PEEK_PX + 8 : 6}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <RadarMapButton />
                <PrecipAccumMapButton />
                <SunShadowMapButton />
                {hasClimbingLayer && <MapFilter />}
                <LayerSwitcherDynamic />
              </Stack>
            </BottomRight>
          </PrecipAccumProvider>
        </RadarProvider>
      </SunShadowProvider>
    </>
  );
};

export default Map;

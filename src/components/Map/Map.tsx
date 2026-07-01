import React from 'react';

import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import BugReport from '@mui/icons-material/BugReport';
import { Button, CircularProgress, Stack } from '@mui/material';
import { isDesktop } from '../helpers';
import { MapFooter } from './MapFooter/MapFooter';
import { SHOW_PROTOTYPE_UI } from '../../config.mjs';
import { LayerSwitcherButton } from '../LayerSwitcher/LayerSwitcherButton';
import { MaptilerLogo } from './MapFooter/MaptilerLogo';
import { TopMenu } from './HamburgerMenu/TopMenu';
import { useMapStateContext } from '../utils/MapStateContext';
import { Weather } from './Weather/Weather';
import { MapFilter } from './MapFilter/MapFilter';
import { MyListsLayer } from './MyListsLayer';
import { CragPhotoMarkers } from './CragPhotoMarkers';
import { SunShadow } from './SunShadow/SunShadow';
import { PrecipitationOverlay } from './Radar/PrecipitationOverlay';
import { PrecipAccumControl } from './Radar/PrecipAccumControl';
import { RADAR_PRODUCT } from './Radar/precipitationProducts';

const BrowserMapDynamic = dynamic(() => import('./BrowserMap'), {
  ssr: false,
  loading: () => <div />,
});

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

const TopRight = styled.div`
  position: absolute;
  z-index: 100;
  padding: 10px;
  right: -4px;
  top: 62px;

  @media ${isDesktop} {
    top: 0;
  }
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
const BottomRight = styled.div`
  position: absolute;
  right: 6px;
  bottom: 6px;
  pointer-events: none;
  z-index: 998;
`;

// Keep the filter / shadow buttons above the (desktop, persistent) layer
// switcher drawer paper so they stay visible and clickable over the sidebar.
const ControlAboveDrawer = styled.div`
  position: relative;
  z-index: 1300;
  display: inline-flex;
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

  return (
    <>
      <BrowserMapDynamic />
      {mapLoaded && <MyListsLayer />}
      {mapLoaded && <CragPhotoMarkers />}
      {!mapLoaded && <Spinner color="secondary" />}
      <NoscriptMessage />
      <TopRight>
        <TopMenu />
      </TopRight>
      <BottomLeft>
        {SHOW_PROTOTYPE_UI && <BugReportButton />}
        <MaptilerLogo />
        <Weather />
        <MapFooter />
      </BottomLeft>
      <BottomRight>
        <Stack direction="row" alignItems="center" gap={1}>
          <ControlAboveDrawer>
            <PrecipitationOverlay product={RADAR_PRODUCT} />
          </ControlAboveDrawer>
          <ControlAboveDrawer>
            <PrecipAccumControl />
          </ControlAboveDrawer>
          <ControlAboveDrawer>
            <SunShadow />
          </ControlAboveDrawer>
          {hasClimbingLayer && (
            <ControlAboveDrawer>
              <MapFilter />
            </ControlAboveDrawer>
          )}
          <LayerSwitcherDynamic />
        </Stack>
      </BottomRight>
    </>
  );
};

export default Map;

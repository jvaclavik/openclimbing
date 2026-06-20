import styled from '@emotion/styled';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import LayersIcon from '@mui/icons-material/Layers';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import maplibregl, { StyleSpecification } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { t } from '../../../services/intl';
import { usePersistedScaleControl } from '../../Map/behaviour/PersistedScaleControl';
import { outdoorStyle } from '../../Map/styles/outdoorStyle';
import { touristStyle } from '../../Map/styles/touristStyle';
import { COMPASS_TOOLTIP } from '../../Map/useAddTopRightControls';
import { RoutePositionToolbar } from './RoutePositionToolbar';
import { getValidCragCenter } from './utils/cragCenter';
import { useCragFeatureForRoutes } from './utils/useCragFeatureForRoutes';

const Container = styled.div<{ $expanded: boolean }>`
  position: ${({ $expanded }) => ($expanded ? 'fixed' : 'relative')};
  overflow: hidden;
  border-radius: 3px;
  background: ${({ theme }) => theme.palette.background.default};

  ${({ $expanded }) =>
    $expanded
      ? `
    inset: 0;
    height: 100%;
    width: 100%;
    z-index: 1300;
  `
      : `
    height: 500px;
    left: -30px;
    width: calc(100% + 60px);
  `}
`;

const LoadingContainer = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Map = styled.div<{ $isVisible: boolean }>`
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  height: 100%;
  width: 100%;
`;

const MapStyleChip = styled.div`
  position: absolute;
  top: 12px;
  right: 96px;
  z-index: 1001;
`;

const ExpandButton = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1001;
`;

const SettingsButton = styled.div`
  position: absolute;
  top: 12px;
  right: 52px;
  z-index: 1001;
`;

type MapStyleName = 'tourist' | 'outdoor' | 'satellite';

const STYLE_ORDER: MapStyleName[] = ['tourist', 'outdoor', 'satellite'];

const getStyle = (name: MapStyleName): StyleSpecification | string => {
  if (name === 'satellite') {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY_MAPTILER;
    return `https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}`;
  }
  if (name === 'outdoor') {
    return outdoorStyle;
  }
  return touristStyle;
};

const getStyleLabel = (name: MapStyleName) => {
  if (name === 'satellite') return t('climbing.map_style_satellite');
  if (name === 'outdoor') return t('climbing.map_style_outdoor');
  return t('climbing.map_style_tourist');
};

const CragRoutesPositionMap = () => {
  const feature = useCragFeatureForRoutes();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleName>('tourist');
  const [styleEpoch, setStyleEpoch] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const [showGrades, setShowGrades] = useState(true);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );

  const cragCenter = getValidCragCenter(feature);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    setIsMapLoaded(false);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getStyle('tourist'),
      attributionControl: false,
      refreshExpiredTiles: false,
      center: cragCenter,
      zoom: 18.5,
      locale: {
        'NavigationControl.ResetBearing': COMPASS_TOOLTIP,
      },
    });

    map.scrollZoom.setWheelZoomRate(1 / 200);
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        fitBoundsOptions: { duration: 4000 },
        trackUserLocation: true,
      }),
    );
    mapRef.current = map;

    const handleLoad = () => setIsMapLoaded(true);
    map.on('load', handleLoad);

    return () => {
      map.off('load', handleLoad);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cragCenter?.[0], cragCenter?.[1]]);

  useEffect(() => {
    const id = window.setTimeout(() => mapRef.current?.resize(), 60);
    return () => window.clearTimeout(id);
  }, [isExpanded]);

  usePersistedScaleControl(mapRef, isMapLoaded);

  const switchMapStyle = () => {
    const next =
      STYLE_ORDER[(STYLE_ORDER.indexOf(mapStyle) + 1) % STYLE_ORDER.length];
    setMapStyle(next);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(getStyle(next));
    map.once('styledata', () => setStyleEpoch((prev) => prev + 1));
  };

  return (
    <Container $expanded={isExpanded}>
      {!isMapLoaded && (
        <LoadingContainer>
          <CircularProgress color="primary" />
        </LoadingContainer>
      )}
      <MapStyleChip>
        <Chip
          component="button"
          label={getStyleLabel(mapStyle)}
          icon={<LayersIcon />}
          onClick={switchMapStyle}
          color="secondary"
        />
      </MapStyleChip>
      <SettingsButton>
        <Tooltip title={t('climbing.display_settings')} arrow>
          <IconButton
            size="small"
            color="secondary"
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
        >
          <MenuItem onClick={() => setShowNames((prev) => !prev)}>
            <ListItemIcon>
              <Checkbox edge="start" checked={!showNames} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText primary={t('climbing.hide_route_names')} />
          </MenuItem>
          <MenuItem onClick={() => setShowGrades((prev) => !prev)}>
            <ListItemIcon>
              <Checkbox edge="start" checked={!showGrades} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText primary={t('climbing.hide_difficulty')} />
          </MenuItem>
        </Menu>
      </SettingsButton>
      <ExpandButton>
        <Tooltip
          title={
            isExpanded ? t('climbing.shrink_map') : t('climbing.enlarge_map')
          }
          arrow
        >
          <IconButton
            size="small"
            color="secondary"
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
          </IconButton>
        </Tooltip>
      </ExpandButton>
      {isMapLoaded && (
        <RoutePositionToolbar
          mapRef={mapRef}
          isMapLoaded={isMapLoaded}
          styleEpoch={styleEpoch}
          showNames={showNames}
          showGrades={showGrades}
        />
      )}
      <Map
        $isVisible={isMapLoaded}
        ref={containerRef}
        className="edit-feature-map"
      />
    </Container>
  );
};

export default CragRoutesPositionMap; // dynamic import

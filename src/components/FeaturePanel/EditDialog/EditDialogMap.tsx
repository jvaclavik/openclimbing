import styled from '@emotion/styled';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import MapIcon from '@mui/icons-material/Map';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Alert,
  Checkbox,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Radio,
  Tooltip,
} from '@mui/material';
import * as maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../Map/maplibreSetup';
import { t } from '../../../services/intl';
import { getApiId, getShortId } from '../../../services/helpers';
import { Feature, LonLat, TranslationId } from '../../../services/types';
import { fetchWays } from '../../../services/osm/fetchWays';
import { usePersistedScaleControl } from '../../Map/behaviour/PersistedScaleControl';
import { touristStyle } from '../../Map/styles/touristStyle';
import { COMPASS_TOOLTIP } from '../../Map/useAddTopRightControls';
import { convertHexToRgba } from '../../utils/colorUtils';
import { useFeatureContext } from '../../utils/FeatureContext';
import {
  EditMapPosition,
  useUserSettingsContext,
} from '../../utils/userSettings/UserSettingsContext';
import { RoutePositionToolbar } from '../Climbing/RoutePositionToolbar';
import { usePhotoHighlightContext } from '../Climbing/contexts/PhotoHighlightContext';
import {
  getValidCragCenter,
  isValidLonLat,
} from '../Climbing/utils/cragCenter';
import { isRouteTags } from '../Climbing/utils/cragRoutesItems';
import { useCragFeatureForRoutes } from '../Climbing/utils/useCragFeatureForRoutes';
import { useGetPhotoExifs } from '../Climbing/utils/usePhotoExifGps';
import { usePhotoMarkers } from '../Climbing/utils/usePhotoMarkers';
import {
  getWikimediaCommonsPhotoValues,
  removeFilePrefix,
} from '../Climbing/utils/photo';
import { useHasCragRoutesMap } from './EditContent/FeatureEditSection/CragRoutesLocationEditor';
import { useCurrentItem, useEditContext } from './context/EditContext';
import { useDraggableFeatureMarker } from './EditContent/FeatureEditSection/LocationEditor/useDraggableMarker';
import { useNeedsNodeLocation } from './EditContent/FeatureEditSection/LocationEditor/LocationEditor';

// BFS the (recursively loaded) member tree for the feature with this shortId and
// return its map position — used to centre the map on the active route even when
// it lives in a neighbouring sector.
const findMemberCenterById = (
  feature: Feature | undefined,
  shortId: string | undefined,
): LonLat | undefined => {
  if (!feature || !shortId) return undefined;
  const stack = [...(feature.memberFeatures ?? [])];
  while (stack.length) {
    const current = stack.shift();
    if (!current) continue;
    if (
      getShortId(current.osmMeta) === shortId &&
      isValidLonLat(current.center)
    )
      return current.center;
    if (current.memberFeatures?.length) stack.push(...current.memberFeatures);
  }
  return undefined;
};

// A node's location is editable when it's brand new or a standalone node that
// isn't part of any way (same rule as the old LocationEditor).
const useIsNodeLocationEditable = () => {
  const { shortId } = useCurrentItem();
  const osmId = getApiId(shortId);
  const isNew = osmId.id < 0;
  const [isNodeWithoutWay, setIsNodeWithoutWay] = useState(false);

  useEffect(() => {
    let active = true;
    if (osmId.type === 'node' && !isNew) {
      fetchWays(osmId).then((ways) => {
        if (active) setIsNodeWithoutWay(ways.length === 0);
      });
    } else {
      setIsNodeWithoutWay(false);
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, osmId.type, osmId.id]);

  return osmId.type === 'node' && (isNew || isNodeWithoutWay);
};

// Mounted only for editable nodes; the hook wires a draggable marker that writes
// back to the current item's nodeLonLat.
const NodeLocationMarker: React.FC<{
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
}> = ({ mapRef }) => {
  useDraggableFeatureMarker(mapRef as React.MutableRefObject<maplibregl.Map>);
  return null;
};

// When fullscreen the map breaks out of the split pane and overlays the whole
// dialog (kept as a CSS overlay so the persistent MapLibre instance is never
// remounted/reloaded — only resized via the ResizeObserver below).
const Container = styled.div<{ $fullscreen: boolean }>`
  overflow: hidden;
  height: 100%;
  width: 100%;
  container-type: inline-size;
  background: ${({ theme }) => theme.palette.background.default};
  ${({ $fullscreen }) =>
    $fullscreen
      ? `
    position: fixed;
    inset: 0;
    z-index: 1300;
  `
      : `
    position: relative;
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

const MapEl = styled.div<{ $isVisible: boolean }>`
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  height: 100%;
  width: 100%;
`;

const ControlsRow = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GlassIconButton = styled(IconButton)`
  width: 40px;
  height: 40px;
  padding: 0;
  background: ${({ theme }) =>
    convertHexToRgba(theme.palette.background.paper, 0.8)};
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);

  &:hover {
    background: ${({ theme }) => theme.palette.background.paper};
  }
`;

type MapStyleName = 'tourist' | 'satellite';

const STYLE_ORDER: MapStyleName[] = ['tourist', 'satellite'];

const getStyle = (name: MapStyleName): StyleSpecification | string => {
  if (name === 'satellite') {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY_MAPTILER;
    return `https://api.maptiler.com/maps/hybrid/style.json?key=${apiKey}`;
  }
  return touristStyle;
};

const getStyleLabel = (name: MapStyleName) =>
  name === 'satellite'
    ? t('climbing.map_style_satellite')
    : t('climbing.map_style_tourist');

// Centres the (already created) map on the active element: once when the first
// valid centre becomes known after load (jumpTo, no animation), then a flyTo
// whenever the current element changes. Keyed on `current` for the pan so it
// never fights a marker drag (which moves position but not the current item).
const useMapCentering = (
  map: maplibregl.Map | null,
  activeCenter: LonLat | undefined,
  current: string,
) => {
  const hasInitiallyCenteredRef = useRef(false);
  useEffect(() => {
    if (!map || hasInitiallyCenteredRef.current) return;
    if (!isValidLonLat(activeCenter)) return;
    map.jumpTo({ center: activeCenter, zoom: 18.5 });
    hasInitiallyCenteredRef.current = true;
  }, [map, activeCenter]);
  useEffect(() => {
    if (!map || !isValidLonLat(activeCenter)) return;
    map.flyTo({ center: activeCenter, duration: 400, speed: 2.4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, current]);
};

// Encapsulates the single persistent MapLibre instance: created once for the
// whole dialog session (never per crag/element), re-centred on the active item,
// plus photo markers, pane-resize sync and style switching.
const useEditDialogMapInstance = () => {
  const feature = useCragFeatureForRoutes();
  const currentItem = useCurrentItem();
  const { current } = useEditContext();
  const { feature: panelFeature } = useFeatureContext();
  const { highlightedPhoto, togglePhoto } = usePhotoHighlightContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleName>('tourist');
  const [styleEpoch, setStyleEpoch] = useState(0);

  const cragCenter = getValidCragCenter(feature);
  const cragLon = cragCenter?.[0];
  const cragLat = cragCenter?.[1];

  const activeCenter = useMemo<LonLat | undefined>(() => {
    if (isValidLonLat(currentItem?.nodeLonLat)) return currentItem.nodeLonLat;
    const byMember = findMemberCenterById(feature, current);
    if (byMember) return byMember;
    if (isValidLonLat(cragCenter)) return cragCenter;
    return isValidLonLat(panelFeature?.center)
      ? panelFeature.center
      : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentItem?.nodeLonLat,
    feature,
    current,
    panelFeature,
    cragLon,
    cragLat,
  ]);

  // Create the map exactly once for the whole dialog session. It must NOT be
  // keyed on the crag centre / current item — otherwise it reloads when the
  // feature resolves or when switching to an element of another crag. Switching
  // elements only re-centres the existing map (see effects below).
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const createdMap = new maplibregl.Map({
      container: containerRef.current,
      style: getStyle('tourist'),
      attributionControl: false,
      refreshExpiredTiles: false,
      center: activeCenter ?? cragCenter ?? panelFeature?.center,
      zoom: 18.5,
      locale: { 'NavigationControl.ResetBearing': COMPASS_TOOLTIP },
    });
    createdMap.scrollZoom.setWheelZoomRate(1 / 200);
    createdMap.addControl(
      new maplibregl.NavigationControl({
        showZoom: true,
        showCompass: true,
        visualizePitch: true,
      }),
    );
    createdMap.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        fitBoundsOptions: { duration: 4000 },
        trackUserLocation: true,
      }),
    );
    mapRef.current = createdMap;
    const handleLoad = () => {
      setIsMapLoaded(true);
      setMap(createdMap);
    };
    createdMap.on('load', handleLoad);
    return () => {
      createdMap.off('load', handleLoad);
      createdMap.remove();
      mapRef.current = null;
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapCentering(map, activeCenter, current);

  const photoNames = useMemo(
    () =>
      getWikimediaCommonsPhotoValues(currentItem?.tags ?? {}).map(
        removeFilePrefix,
      ),
    [currentItem?.tags],
  );
  const photoExifs = useGetPhotoExifs(photoNames);
  usePhotoMarkers(map, photoExifs, photoNames, {
    activePhoto: highlightedPhoto,
    onPhotoClick: togglePhoto,
  });

  // Keep MapLibre in sync with the pane size (split-pane drag, minimize/restore,
  // window resize) — otherwise the canvas keeps its stale size and clips.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  usePersistedScaleControl(mapRef, isMapLoaded);

  const switchMapStyle = () => {
    const next =
      STYLE_ORDER[(STYLE_ORDER.indexOf(mapStyle) + 1) % STYLE_ORDER.length];
    setMapStyle(next);
    const currentMap = mapRef.current;
    if (!currentMap) return;
    currentMap.setStyle(getStyle(next));
    currentMap.once('styledata', () => setStyleEpoch((prev) => prev + 1));
  };

  return {
    containerRef,
    mapRef,
    map,
    isMapLoaded,
    mapStyle,
    switchMapStyle,
    styleEpoch,
  };
};

type ControlsProps = {
  mapStyle: MapStyleName;
  onSwitchStyle: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showNames: boolean;
  onToggleNames: () => void;
  showGrades: boolean;
  onToggleGrades: () => void;
};

const MAP_POSITION_OPTIONS: {
  value: EditMapPosition;
  label: TranslationId;
}[] = [
  { value: 'auto', label: 'editdialog.map_position_auto' },
  { value: 'right', label: 'editdialog.map_position_right' },
  { value: 'bottom', label: 'editdialog.map_position_bottom' },
];

const MapControls: React.FC<ControlsProps> = ({
  mapStyle,
  onSwitchStyle,
  isFullscreen,
  onToggleFullscreen,
  showNames,
  onToggleNames,
  showGrades,
  onToggleGrades,
}) => {
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const mapPosition = userSettings['editdialog.mapPosition'] ?? 'auto';
  return (
    <>
      <ControlsRow>
        <Tooltip title={getStyleLabel(mapStyle)} arrow>
          <GlassIconButton
            onClick={onSwitchStyle}
            aria-label={getStyleLabel(mapStyle)}
          >
            {mapStyle === 'satellite' ? (
              <SatelliteAltIcon fontSize="small" />
            ) : (
              <MapIcon fontSize="small" />
            )}
          </GlassIconButton>
        </Tooltip>
        <Tooltip title={t('climbing.display_settings')} arrow>
          <GlassIconButton
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
            aria-label={t('climbing.display_settings')}
          >
            <SettingsIcon fontSize="small" />
          </GlassIconButton>
        </Tooltip>
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
        >
          <MenuItem onClick={onToggleNames}>
            <ListItemIcon>
              <Checkbox edge="start" checked={!showNames} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText primary={t('climbing.hide_route_names')} />
          </MenuItem>
          <MenuItem onClick={onToggleGrades}>
            <ListItemIcon>
              <Checkbox edge="start" checked={!showGrades} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText primary={t('climbing.hide_difficulty')} />
          </MenuItem>
          <Divider />
          <ListSubheader disableSticky>
            {t('editdialog.map_position')}
          </ListSubheader>
          {MAP_POSITION_OPTIONS.map(({ value, label }) => (
            <MenuItem
              key={value}
              selected={mapPosition === value}
              onClick={() => setUserSetting('editdialog.mapPosition', value)}
            >
              <ListItemIcon>
                <Radio
                  edge="start"
                  checked={mapPosition === value}
                  tabIndex={-1}
                />
              </ListItemIcon>
              <ListItemText primary={t(label)} />
            </MenuItem>
          ))}
        </Menu>
        <Tooltip
          title={
            isFullscreen
              ? t('editdialog.exit_fullscreen_map')
              : t('editdialog.fullscreen_map')
          }
          arrow
        >
          <GlassIconButton
            onClick={onToggleFullscreen}
            aria-label={
              isFullscreen
                ? t('editdialog.exit_fullscreen_map')
                : t('editdialog.fullscreen_map')
            }
          >
            {isFullscreen ? (
              <CloseFullscreenIcon fontSize="small" />
            ) : (
              <OpenInFullIcon fontSize="small" />
            )}
          </GlassIconButton>
        </Tooltip>
      </ControlsRow>
    </>
  );
};

const NoLocationAlert = styled(Alert)`
  position: absolute;
  z-index: 1001;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
`;

const EditDialogMap = () => {
  const {
    containerRef,
    mapRef,
    map,
    isMapLoaded,
    mapStyle,
    switchMapStyle,
    styleEpoch,
  } = useEditDialogMapInstance();
  const hasCragRoutesMap = useHasCragRoutesMap();
  const isNodeLocationEditable = useIsNodeLocationEditable();
  const needsLocation = useNeedsNodeLocation();
  const currentItem = useCurrentItem();
  const currentIsRoute = isRouteTags(currentItem?.tags);
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const isFullscreen = userSettings['editdialog.mapFullscreen'] ?? false;
  const showNames = userSettings['editdialog.showRouteNames'] ?? true;
  const showGrades = userSettings['editdialog.showRouteGrades'] ?? true;

  // Resize the canvas once the fullscreen layout has been applied (the
  // ResizeObserver covers it too, but this avoids a one-frame stale canvas).
  useEffect(() => {
    const id = requestAnimationFrame(() => mapRef.current?.resize());
    return () => cancelAnimationFrame(id);
  }, [isFullscreen, mapRef]);

  return (
    <Container $fullscreen={isFullscreen}>
      {!isMapLoaded && (
        <LoadingContainer>
          <CircularProgress color="primary" />
        </LoadingContainer>
      )}
      <MapControls
        mapStyle={mapStyle}
        onSwitchStyle={switchMapStyle}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() =>
          setUserSetting('editdialog.mapFullscreen', !isFullscreen)
        }
        showNames={showNames}
        onToggleNames={() =>
          setUserSetting('editdialog.showRouteNames', !showNames)
        }
        showGrades={showGrades}
        onToggleGrades={() =>
          setUserSetting('editdialog.showRouteGrades', !showGrades)
        }
      />
      {isMapLoaded && hasCragRoutesMap && (
        <RoutePositionToolbar
          mapRef={mapRef}
          isMapLoaded={isMapLoaded}
          styleEpoch={styleEpoch}
          showNames={showNames}
          showGrades={showGrades}
        />
      )}
      {map &&
        isNodeLocationEditable &&
        !(currentIsRoute && hasCragRoutesMap) && (
          <NodeLocationMarker mapRef={mapRef} />
        )}
      <MapEl
        $isVisible={isMapLoaded}
        ref={containerRef}
        className="edit-feature-map"
      />
      {needsLocation && (
        <NoLocationAlert severity="info">
          {t('editdialog.no_location_alert')}
        </NoLocationAlert>
      )}
    </Container>
  );
};

export default EditDialogMap; // dynamic import

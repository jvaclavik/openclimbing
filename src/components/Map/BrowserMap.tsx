import React, { useEffect } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStateContext, View } from '../utils/MapStateContext';
import {
  createMapEffectHook,
  createMapEventHook,
  MapEventHandler,
  useMobileMode,
} from '../helpers';
import { useFeatureContext } from '../utils/FeatureContext';
import { useFeatureMarker } from './behaviour/useFeatureMarker';
import { useOnMapClicked } from './behaviour/useOnMapClicked';
import { useUpdateViewOnMove } from './behaviour/useUpdateViewOnMove';
import { useUpdateStyle } from './behaviour/useUpdateStyle';
import { useInitMap } from './behaviour/useInitMap';
import { Translation } from '../../services/intl';
import { useToggleTerrainControl } from './behaviour/useToggleTerrainControl';
import { webglSupported } from './helpers';
import { useOnMapLongPressed } from './behaviour/useOnMapLongPressed';
import { useAddTopRightControls } from './useAddTopRightControls';
import { usePersistedScaleControl } from './behaviour/PersistedScaleControl';
import { useUserThemeContext } from '../../helpers/theme';
import { useSnackbar } from '../utils/SnackbarContext';
import { PreviewArrow, usePreviewMarker } from './behaviour/usePreviewMarker';

const useOnMapLoaded = createMapEventHook<'load', [MapEventHandler<'load'>]>(
  (_, onMapLoaded) => ({
    eventType: 'load',
    eventHandler: onMapLoaded,
  }),
);

const useUpdateMap = createMapEffectHook<[View]>((map, viewForMap) => {
  const center: [number, number] = [
    parseFloat(viewForMap[2]),
    parseFloat(viewForMap[1]),
  ];
  map.jumpTo({ center, zoom: parseFloat(viewForMap[0]) });
});

// iOS Safari shows a magnifier loupe and text-selection UI during touch
// gestures on the map (notably the tap-then-hold-and-drag zoom) — even with
// user-select:none in CSS. Two listeners cover the two stages:
//   - selectstart fires when selection would start; prevent it.
//   - touchstart with passive:false lets us kill iOS's default touch
//     behaviors (loupe, callout) before any visual feedback appears.
// Skip buttons/links so the MapLibre +/- controls keep working.
const useSuppressMapSelection = (
  containerRef: React.RefObject<HTMLDivElement>,
) => {
  useEffect(() => {
    const onSelectStart = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest?.('.maplibregl-map')) {
        e.preventDefault();
      }
    };
    document.addEventListener('selectstart', onSelectStart);
    return () => document.removeEventListener('selectstart', onSelectStart);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    // Only suppress on the second touchstart of a quick tap-tap-hold sequence
    // (the gesture that triggers the iOS loupe). A bare single tap must keep
    // its default browser behavior so the synthetic click event still fires
    // for feature-clicking on the map.
    let lastTouchEnd = 0;
    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.('button, a, [role="button"], input, textarea')) {
        return;
      }
      const isSecondQuickTap = Date.now() - lastTouchEnd < 350;
      if (isSecondQuickTap) {
        e.preventDefault();
      }
    };
    const onTouchEnd = () => {
      lastTouchEnd = Date.now();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef]);
};

const NotSupportedMessage = () => (
  <span
    style={{ position: 'absolute', left: '48%', top: '48%', maxWidth: '350px' }}
  >
    <Translation id="webgl_error" />
  </span>
);

// TODO #460 https://cdn.klokantech.com/openmaptiles-language/v1.0/openmaptiles-language.js + use localized name in FeaturePanel
const BrowserMap = () => {
  const { showToast } = useSnackbar();
  const { userLayers } = useMapStateContext();
  const mobileMode = useMobileMode();
  const { setFeature } = useFeatureContext();
  const { mapLoaded, setMapLoaded, mapClickOverrideRef } = useMapStateContext();
  const { currentTheme } = useUserThemeContext();

  const [map, containerRef, mapRef] = useInitMap();
  useSuppressMapSelection(containerRef);
  useAddTopRightControls(map, mobileMode);
  useOnMapClicked(map, setFeature, mapClickOverrideRef);
  useOnMapLongPressed(map, setFeature);
  useOnMapLoaded(map, setMapLoaded);
  useFeatureMarker(map);
  usePreviewMarker(map);

  const { viewForMap, setViewFromMap, setBbox, activeLayers } =
    useMapStateContext();
  useUpdateViewOnMove(map, setViewFromMap, setBbox);
  useToggleTerrainControl(map);
  useUpdateMap(map, viewForMap);
  useUpdateStyle(
    map,
    activeLayers,
    userLayers,
    mapLoaded,
    currentTheme,
    showToast,
  );

  usePersistedScaleControl(mapRef, mapLoaded);

  return (
    <>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      <PreviewArrow />
    </>
  );
};

const BrowserMapCheck = () => {
  const { setMapLoaded } = useMapStateContext();

  if (!webglSupported) {
    setMapLoaded();
    return <NotSupportedMessage />;
  }

  return <BrowserMap />;
};

export default BrowserMapCheck; // dynamic import

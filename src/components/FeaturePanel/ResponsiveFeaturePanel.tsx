import { useMobileMode } from '../helpers';
import { useFeatureContext } from '../utils/FeatureContext';
import { FeaturePanelInDrawer } from './FeaturePanelInDrawer';
import { FeaturePanelOnSide } from './FeaturePanelOnSide';
import React, { useEffect, useRef } from 'react';
import { useMapStateContext } from '../utils/MapStateContext';
import { Scrollbars } from 'react-custom-scrollbars';
import { useRouter } from 'next/router';
import { getMapViewFromHash } from '../App/helpers';
import { getFeatureBbox } from '../../services/getCenter';
import { mapCreatedPromise } from '../../services/mapStorage';
import { FEATURE_PANEL_WIDTH } from '../utils/PanelHelpers';
import { Feature } from '../../services/types';
import { View } from '../utils/MapStateContext';
import type { LngLat } from 'maplibre-gl';

const FEATURE_ZOOM = 17;
const PADDING = 20;

// The map is created later than the panel (dynamic import), so on the initial
// url open we have to wait for it - it is the only one who can do the mercator
// math. We only borrow its camera, the move itself goes through setView().
const getBboxView = async (feature: Feature): Promise<View | undefined> => {
  const [w, s, e, n] = getFeatureBbox(feature) ?? [];
  if (w === e && s === n) {
    return undefined; // feature without extent - its center is enough
  }

  const map = await mapCreatedPromise;
  const panelWidth = window.innerWidth > 700 ? FEATURE_PANEL_WIDTH : 0;
  const camera = map.cameraForBounds([w, s, e, n], {
    padding: {
      top: PADDING,
      bottom: PADDING,
      right: PADDING,
      left: panelWidth + PADDING,
    },
    maxZoom: FEATURE_ZOOM,
  });
  if (!camera) {
    return undefined;
  }

  const { lat, lng } = camera.center as LngLat;
  return [camera.zoom.toFixed(2), lat.toFixed(4), lng.toFixed(4)];
};

const useUpdateViewFromFeature = () => {
  const { feature } = useFeatureContext();
  const { setView } = useMapStateContext();

  useEffect(() => {
    if (!feature?.center) return undefined;
    // clicking a feature on the map keeps the hash (pushFeatureToRouter) - the
    // map must not move in that case, only url/router opens are zoomed
    if (getMapViewFromHash()) return undefined;

    let cancelled = false;
    getBboxView(feature).then((bboxView) => {
      if (cancelled) return;

      const [lon, lat] = feature.center.map((deg) => deg.toFixed(4));
      setView(bboxView ?? [`${FEATURE_ZOOM}.00`, lat, lon]);
    });

    return () => {
      cancelled = true;
    };
  }, [feature, setView]);
};

const useScrollToTopWhenRouteChanged = () => {
  const isMobileMode = useMobileMode();
  const desktopScrollRef = useRef<Scrollbars>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = isMobileMode ? mobileScrollRef : desktopScrollRef;
  const router = useRouter();

  useEffect(() => {
    const routeChangeComplete = () => {
      if (scrollRef?.current) {
        if (isMobileMode) {
          (scrollRef as any).current?.scrollTo?.(0, 0);
        } else {
          (scrollRef as any).current?.scrollToTop?.();
        }
      }
    };
    router.events.on('routeChangeComplete', routeChangeComplete);

    return () => {
      router.events.off('routeChangeComplete', routeChangeComplete);
    };
  }, [isMobileMode, router.events, scrollRef]);

  return scrollRef;
};

// TODO this is temporary refactoring, ultimate goal is extract PanelWrapper outside and use it for all panels including here

export const ResponsiveFeaturePanel = () => {
  const isMobileMode = useMobileMode();
  const { featureShown } = useFeatureContext();
  const scrollRef = useScrollToTopWhenRouteChanged() as any;
  useUpdateViewFromFeature();

  if (!featureShown) {
    return null;
  }

  return isMobileMode ? (
    <FeaturePanelInDrawer scrollRef={scrollRef} />
  ) : (
    <FeaturePanelOnSide scrollRef={scrollRef} />
  );
};

import {
  Map,
  MapGeoJSONFeature,
  MapMouseEvent,
  StyleSpecification,
} from 'maplibre-gl';
import { climbingLayers } from '../climbingTiles/climbingLayers/climbingLayers';
import { isMobileDevice } from '../../helpers';
import { setHoveredCragRoutes } from '../climbingTiles/selectedCragRoutes';
import { CLIMBING_TILES_SOURCE, toOutlineMapId } from '../climbingTiles/consts';
import {
  registerClimbingHoverReset,
  setClimbingFeatureState,
} from '../climbingTiles/climbingFeatureState';
import {
  clearVectorTileFeature,
  setVectorTileFeatureState,
} from './safeMapFeatureState';

const HOVER_EXPRESSION = ['case', ['boolean', ['feature-state', 'hover'], false], 0.5, 1]; // prettier-ignore
const ICON_OPACITY = ['case', ['boolean', ['feature-state', 'hideIcon'], false], 0, HOVER_EXPRESSION]; // prettier-ignore

export const addHoverPaint = (origStyle): StyleSpecification => {
  origStyle.layers
    .filter((layer) => layer.id.match(/^poi-/))
    .forEach((layer) => {
      if (layer.paint) {
        layer.paint['icon-opacity'] = ICON_OPACITY; // eslint-disable-line no-param-reassign
      }
    });

  return origStyle;
};

const CLIMBING_CLICKABLE_LAYERS = climbingLayers
  .filter((l) => (l.metadata as any)?.clickableWithOsmId)
  .map((l) => l.id);

const getHoveredCragId = (feature: MapGeoJSONFeature | null) =>
  feature?.source === CLIMBING_TILES_SOURCE &&
  feature.properties?.type === 'crag'
    ? (feature.id as number)
    : undefined;

type HoverMap = Map & {
  __hoverLayers?: string[];
  __hoverSetup?: boolean;
};

export const setUpHover = (map: Map, layersWithOsmId: string[]) => {
  const hoverMap = map as HoverMap;
  // Style rebuilds call this again — keep the layer list fresh, bind listeners once.
  hoverMap.__hoverLayers = layersWithOsmId;
  if (hoverMap.__hoverSetup) {
    return;
  }
  hoverMap.__hoverSetup = true;

  let lastHover: MapGeoJSONFeature | null = null;

  const setHover = (feature: MapGeoJSONFeature | null, hover: boolean) => {
    if (!feature) return;
    if (feature.source === CLIMBING_TILES_SOURCE) {
      const id = feature.id as number;
      setClimbingFeatureState(map, id, { hover });
      const type = feature.properties?.type;
      if (type === 'crag' || type === 'area') {
        setClimbingFeatureState(map, toOutlineMapId(id), { hover });
      }
      return;
    }
    if (hover) {
      setVectorTileFeatureState(map, feature, { hover: true });
    } else {
      clearVectorTileFeature(map, feature);
    }
  };

  const featureHovered = (feature: MapGeoJSONFeature) => {
    if (feature !== lastHover) {
      setHover(lastHover, false);
      setHover(feature, true);
      setHoveredCragRoutes(getHoveredCragId(feature));
      lastHover = feature;
      map.getCanvas().style.cursor = 'pointer'; // eslint-disable-line no-param-reassign
    }
  };

  const cancelHover = () => {
    setHover(lastHover, false);
    setHoveredCragRoutes(undefined);
    lastHover = null;
    map.getCanvas().style.cursor = ''; // eslint-disable-line no-param-reassign
  };

  const abandonHover = () => {
    lastHover = null;
    setHoveredCragRoutes(undefined);
    map.getCanvas().style.cursor = ''; // eslint-disable-line no-param-reassign
  };

  const queryHoverLayers = (point: MapMouseEvent['point']) => {
    const layers = (hoverMap.__hoverLayers ?? []).filter((id) =>
      map.getLayer(id),
    );
    if (!layers.length) {
      return [] as MapGeoJSONFeature[];
    }
    return map.queryRenderedFeatures(point, { layers });
  };

  // Own query (guarded via installMapFeatureStateGuard) — avoids MapLibre's
  // per-layer mousemove path that throws mid tile-reload.
  const onMouseMove = (e: MapMouseEvent) => {
    const features = queryHoverLayers(e.point);
    if (!features.length) {
      cancelHover();
      return;
    }
    featureHovered(features[0]);
  };

  registerClimbingHoverReset(() => {
    lastHover = null;
    setHoveredCragRoutes(undefined);
  });

  map.on('zoomstart', abandonHover);
  map.on('mousemove', onMouseMove);
  map.getCanvas().addEventListener('mouseleave', cancelHover);

  if (isMobileDevice()) {
    map.on('click', (e: MapMouseEvent) => {
      const layers = CLIMBING_CLICKABLE_LAYERS.filter((id) => map.getLayer(id));
      if (!layers.length) {
        return;
      }
      const features = map.queryRenderedFeatures(e.point, { layers });
      if (features.length) {
        featureHovered(features[0]);
      }
    });
  }
};

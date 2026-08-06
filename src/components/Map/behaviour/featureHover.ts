import {
  FeatureIdentifier,
  Map,
  MapGeoJSONFeature,
  MapMouseEvent,
  StyleSpecification,
} from 'maplibre-gl';
import { climbingLayers } from '../climbingTiles/climbingLayers/climbingLayers';
import { isMobileDevice } from '../../helpers';
import { setHoveredCragRoutes } from '../climbingTiles/selectedCragRoutes';
import { CLIMBING_TILES_SOURCE } from '../climbingTiles/consts';

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

export const setUpHover = (map: Map, layersWithOsmId: string[]) => {
  let lastHover = null;

  const setHoverOn = (feature: FeatureIdentifier | null) =>
    feature && map.setFeatureState(feature, { hover: true });
  const setHoverOff = (feature: FeatureIdentifier | null) =>
    feature && map.setFeatureState(feature, { hover: false });

  const featureHovered = (feature: MapGeoJSONFeature) => {
    if (feature !== lastHover) {
      setHoverOff(lastHover);
      setHoverOn(feature);
      setHoveredCragRoutes(getHoveredCragId(feature));
      lastHover = feature;
      map.getCanvas().style.cursor = 'pointer'; // eslint-disable-line no-param-reassign
    }
  };

  const onMouseMove = (
    e: MapMouseEvent & { features?: MapGeoJSONFeature[] },
  ) => {
    cancelHover();
    if (e.features && e.features.length > 0) {
      featureHovered(e.features[0]);
    }
  };

  const cancelHover = () => {
    setHoverOff(lastHover);
    setHoveredCragRoutes(undefined);
    lastHover = null;
    // TODO delay 200ms
    map.getCanvas().style.cursor = ''; // eslint-disable-line no-param-reassign
  };

  layersWithOsmId.forEach((layer) => {
    map.on('mousemove', layer, onMouseMove); // TODO unregister
    map.on('mouseleave', layer, cancelHover);
  });

  if (isMobileDevice()) {
    CLIMBING_CLICKABLE_LAYERS.forEach((layer) => {
      map.on('click', layer, onMouseMove);
    });
  }
};

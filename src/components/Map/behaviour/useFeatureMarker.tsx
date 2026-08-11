import maplibregl, { Map } from 'maplibre-gl';
import { useEffect } from 'react';
import { createMapEffectHook } from '../../helpers';
import { convertOsmIdToMapId, layersWithOsmId } from '../helpers';
import { Feature } from '../../../services/types';
import { useFeatureContext } from '../../utils/FeatureContext';
import { setClimbingFeatureState } from '../climbingTiles/climbingFeatureState';
import { CLIMBING_TILES_SOURCE } from '../climbingTiles/consts';
import {
  clearVectorTileFeature,
  setVectorTileFeatureState,
} from './safeMapFeatureState';

const FEATURE_MARKER = {
  color: '#eb5757',
  draggable: false,
};

const setPoiIconVisibility = (
  map: Map,
  feature: Feature | undefined,
  hideIcon: boolean,
) => {
  const style = map.getStyle();

  if (!feature || !style) return;

  const results = map.queryRenderedFeatures(undefined, {
    layers: layersWithOsmId(style),
    filter: ['==', ['id'], convertOsmIdToMapId(feature.osmMeta)],
    validate: false,
  });

  if (!results.length) {
    return;
  }

  const hit = results[0];
  if (hit.source === CLIMBING_TILES_SOURCE) {
    setClimbingFeatureState(map, hit.id as number, { hideIcon });
    return;
  }
  if (hideIcon) {
    setVectorTileFeatureState(map, hit, { hideIcon: true });
  } else {
    clearVectorTileFeature(map, hit);
  }
};

const featureMarker = {} as { ref: maplibregl.Marker; feature: Feature };
const useUpdateFeatureMarker = createMapEffectHook<[Feature]>(
  (map, feature) => {
    if (featureMarker.ref) {
      featureMarker.ref.remove();
      setPoiIconVisibility(map, featureMarker.feature, false);
    }
    featureMarker.feature = feature;
    featureMarker.ref = undefined;

    if (feature?.center) {
      const [lng, lat] = feature.center;
      featureMarker.ref = new maplibregl.Marker(FEATURE_MARKER)
        .setLngLat([lng, lat])
        .addTo(map);
      setPoiIconVisibility(map, feature, true);
    }
  },
);

export const useFeatureMarker = (map: Map) => {
  const { feature } = useFeatureContext();
  useUpdateFeatureMarker(map, feature);

  // Re-hide the basemap icon after tiles reload (zoom clears VT feature-state).
  useEffect(() => {
    if (!map) {
      return undefined;
    }
    const reapply = () => {
      if (feature?.center && map.areTilesLoaded()) {
        setPoiIconVisibility(map, feature, true);
      }
    };
    map.on('idle', reapply);
    return () => {
      map.off('idle', reapply);
    };
  }, [map, feature]);
};

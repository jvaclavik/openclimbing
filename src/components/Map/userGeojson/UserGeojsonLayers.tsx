import { useEffect, useMemo, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, MapLayerMouseEvent, Popup } from 'maplibre-gl';
import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { Point } from 'geojson';
import { getGlobalMap } from '../../../services/mapStorage';
import { t } from '../../../services/intl';
import { useMapStateContext } from '../../utils/MapStateContext';
import {
  GEOJSON_LINK_PROPERTY,
  GEOJSON_NAME_PROPERTY,
  getSafeHttpUrl,
  getUserGeojsonColor,
  USER_GEOJSON_COLOR_PROPERTY,
  USER_GEOJSON_LAYER_PROPERTY,
  UserGeojsonLayer,
  UserGeojsonPoints,
  UserGeojsonProperties,
} from '../../../services/userGeojson';
import { USER_GEOJSON_LAYER_ID, USER_GEOJSON_SOURCE_ID } from './consts';

const LAYER: LayerSpecification = {
  id: USER_GEOJSON_LAYER_ID,
  type: 'circle',
  source: USER_GEOJSON_SOURCE_ID,
  paint: {
    'circle-radius': 7,
    'circle-color': ['get', USER_GEOJSON_COLOR_PROPERTY],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  },
};

const buildCollection = (
  layers: UserGeojsonLayer[],
  activeIds: string[],
): UserGeojsonPoints => ({
  type: 'FeatureCollection',
  features: layers
    .filter(({ id }) => activeIds.includes(id))
    .flatMap((layer) =>
      layer.data.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          [USER_GEOJSON_COLOR_PROPERTY]: getUserGeojsonColor(layer),
          [USER_GEOJSON_LAYER_PROPERTY]: layer.id,
        },
      })),
    ),
});

const createPopupContent = (properties: UserGeojsonProperties) => {
  const root = document.createElement('div');
  root.className = 'user-geojson-popup';
  // maplibre popups have a white background; the app's text color can be light in dark mode
  root.style.color = '#1a1a1a';

  const name = properties[GEOJSON_NAME_PROPERTY];
  if (name != null) {
    const title = document.createElement('strong');
    title.textContent = String(name);
    root.append(title);
  }

  const table = document.createElement('table');
  table.style.fontSize = '12px';
  Object.entries(properties)
    .filter(
      ([key, value]) =>
        key !== GEOJSON_NAME_PROPERTY &&
        key !== GEOJSON_LINK_PROPERTY &&
        key !== USER_GEOJSON_COLOR_PROPERTY &&
        key !== USER_GEOJSON_LAYER_PROPERTY &&
        value !== null &&
        value !== '',
    )
    .forEach(([key, value]) => {
      const row = table.insertRow();
      row.insertCell().textContent = key;
      row.cells[0].style.paddingRight = '8px';
      row.cells[0].style.opacity = '0.7';
      row.insertCell().textContent = String(value);
    });
  root.append(table);

  const href = getSafeHttpUrl(properties[GEOJSON_LINK_PROPERTY]);
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = t('map.open_link');
    link.style.display = 'block';
    link.style.marginTop = '8px';
    root.append(link);
  }

  return root;
};

export const UserGeojsonLayers = () => {
  const { userGeojsonLayers, activeLayers, mapClickOverrideRef } =
    useMapStateContext();
  const data = useMemo(
    () => buildCollection(userGeojsonLayers, activeLayers),
    [userGeojsonLayers, activeLayers],
  );
  const openPopupRef = useRef<{ popup: Popup; layerId: string } | null>(null);

  // close the popup when its layer is turned off or removed
  useEffect(() => {
    const open = openPopupRef.current;
    if (open && !activeLayers.includes(open.layerId)) {
      open.popup.remove();
      openPopupRef.current = null;
    }
  }, [activeLayers, userGeojsonLayers]);

  // setStyle() removes custom sources and layers, so they are re-added on styledata
  useEffect(() => {
    const map = getGlobalMap();
    if (!map) return undefined;

    const ensureLayer = () => {
      const source = map.getSource(USER_GEOJSON_SOURCE_ID) as
        | GeoJSONSource
        | undefined;
      if (source) {
        source.setData(data);
      } else if (map.isStyleLoaded()) {
        // during setStyle() the style is not loaded yet; the next styledata event creates it
        map.addSource(USER_GEOJSON_SOURCE_ID, { type: 'geojson', data });
      }

      if (
        map.getSource(USER_GEOJSON_SOURCE_ID) &&
        !map.getLayer(USER_GEOJSON_LAYER_ID)
      ) {
        map.addLayer(LAYER);
      }
    };

    map.on('styledata', ensureLayer);
    if (map.isStyleLoaded()) {
      ensureLayer();
    }

    return () => {
      map.off('styledata', ensureLayer);
    };
  }, [data]);

  useEffect(() => {
    const map = getGlobalMap();
    if (!map) return undefined;

    const onPointClick = (e: MapLayerMouseEvent) => {
      // the map click override (e.g. picking route points) takes precedence
      if (mapClickOverrideRef.current) return;
      const feature = e.features?.[0];
      if (!feature) return;

      const properties = feature.properties as UserGeojsonProperties;
      openPopupRef.current?.popup.remove();
      const popup = new maplibregl.Popup({ maxWidth: '300px' })
        .setLngLat((feature.geometry as Point).coordinates as [number, number])
        .setDOMContent(createPopupContent(properties))
        .addTo(map);
      openPopupRef.current = {
        popup,
        layerId: String(properties[USER_GEOJSON_LAYER_PROPERTY]),
      };
    };
    const onPointEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const onPointLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', USER_GEOJSON_LAYER_ID, onPointClick);
    map.on('mouseenter', USER_GEOJSON_LAYER_ID, onPointEnter);
    map.on('mouseleave', USER_GEOJSON_LAYER_ID, onPointLeave);

    return () => {
      openPopupRef.current?.popup.remove();
      openPopupRef.current = null;
      map.off('click', USER_GEOJSON_LAYER_ID, onPointClick);
      map.off('mouseenter', USER_GEOJSON_LAYER_ID, onPointEnter);
      map.off('mouseleave', USER_GEOJSON_LAYER_ID, onPointLeave);

      if (map.getLayer(USER_GEOJSON_LAYER_ID)) {
        map.removeLayer(USER_GEOJSON_LAYER_ID);
      }
      if (map.getSource(USER_GEOJSON_SOURCE_ID)) {
        map.removeSource(USER_GEOJSON_SOURCE_ID);
      }
    };
  }, [mapClickOverrideRef]);

  return null;
};

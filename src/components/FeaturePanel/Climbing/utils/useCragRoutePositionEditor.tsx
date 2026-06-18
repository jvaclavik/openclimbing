import maplibregl from 'maplibre-gl';
import { lineString, nearestPointOnLine } from '@turf/turf';
import { useTheme } from '@emotion/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { getApiId, getShortId } from '../../../../services/helpers';
import { Feature, LonLat } from '../../../../services/types';
import {
  getDifficulty,
  getDifficultyColor,
} from '../../../../services/tagging/climbing/routeGrade';
import { RouteDifficulty } from '../types';
import { t } from '../../../../services/intl';
import { useEditContext } from '../../EditDialog/context/EditContext';
import { fetchFreshItem } from '../../EditDialog/context/itemsHelpers';
import { EditDataItem } from '../../EditDialog/context/types';
import { findInItems, isInItems } from '../../EditDialog/context/utils';
import { distributeAlongControlPoints } from './routeMapDistribution';
import { findCragItemForRoutes, isRouteTags } from './cragRoutesItems';

const LINE_SOURCE_ID = 'route-edit-line';
const LINE_LAYER_ID = 'route-edit-line-layer';

type EditableRoute = {
  id: string;
  name: string;
  grade: string;
  difficulty: RouteDifficulty | undefined;
  isNode: boolean;
  originalLonLat: LonLat | undefined;
};

const isValidLonLat = (position: unknown): position is LonLat =>
  Array.isArray(position) &&
  position.length >= 2 &&
  Number.isFinite(position[0]) &&
  Number.isFinite(position[1]);

const routeFromMemberFeature = (
  member: Feature,
  index: number,
): EditableRoute => {
  const difficulty = getDifficulty(member.tags);
  return {
    id: getShortId(member.osmMeta),
    name: member.tags?.name ?? member.tags?.ref ?? `#${index + 1}`,
    grade: difficulty?.grade ?? '',
    difficulty,
    isNode: member.osmMeta.type === 'node',
    originalLonLat: member.center as LonLat | undefined,
  };
};

const routeFromItem = (item: EditDataItem): EditableRoute => {
  const difficulty = getDifficulty(item.tags);
  return {
    id: item.shortId,
    name: item.tags?.name ?? item.tags?.ref ?? item.shortId,
    grade: difficulty?.grade ?? '',
    difficulty,
    isNode: getApiId(item.shortId).type === 'node',
    originalLonLat: item.nodeLonLat,
  };
};

const getEditableRoutes = (
  cragFeature: Feature | undefined,
  cragItem: EditDataItem | undefined,
  items: EditDataItem[],
): EditableRoute[] => {
  const fromMembers = (cragFeature?.memberFeatures ?? [])
    .filter((member) => isRouteTags(member.tags))
    .map(routeFromMemberFeature);

  // While editing, the relation's member list (incl. reordering and newly
  // added routes) lives in the EditContext — follow that order when present.
  if (!cragItem?.members?.length) {
    return fromMembers;
  }

  const byId = new Map(fromMembers.map((route) => [route.id, route]));
  return cragItem.members
    .map((member) => {
      const existing = byId.get(member.shortId);
      if (existing) return existing;
      const item = findInItems(items, member.shortId);
      return item && isRouteTags(item.tags) ? routeFromItem(item) : null;
    })
    .filter((route): route is EditableRoute => !!route);
};

const buildControlPointElement = (label: string) => {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    border: 3px solid #4150a0;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4150a0;
    font: 700 9px/1 sans-serif;
  `;
  el.textContent = label;
  return el;
};

const buildRouteMarkerElement = (
  order: number,
  name: string,
  grade: string,
  color: string,
  isCurrent: boolean,
  showName: boolean,
  showGrade: boolean,
) => {
  const el = document.createElement('div');
  el.className = 'crag-route-marker';
  el.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transform: translateX(6px);
  `;
  const size = isCurrent ? 24 : 18;
  const dot = document.createElement('div');
  dot.className = 'crag-route-dot';
  dot.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    border: ${isCurrent ? '3px solid #4150a0' : '2px solid #f8f4f0'};
    box-shadow: 0 0 0 1px rgba(0,0,0,0.35)${
      isCurrent ? ', 0 0 0 4px rgba(65,80,160,0.35)' : ''
    };
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font: 700 ${isCurrent ? 12 : 10}px/1 sans-serif;
    text-shadow: 0 0 2px rgba(0,0,0,0.6);
  `;
  dot.textContent = String(order);
  const text = document.createElement('span');
  const label = [showName ? name : '', showGrade ? grade : '']
    .filter(Boolean)
    .join('  ');
  text.textContent = label;
  text.style.cssText = `
    font: 600 12px/1.2 sans-serif;
    color: #222;
    background: rgba(255,255,255,0.85);
    padding: 1px 4px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
  `;
  el.appendChild(dot);
  if (label) el.appendChild(text);
  return el;
};

const isSamePosition = (a?: LonLat, b?: LonLat) =>
  !!a && !!b && Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

const buildPopupButton = (
  label: string,
  background: string,
  onClick: () => void,
) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = `
    cursor: pointer;
    border: none;
    border-radius: 4px;
    padding: 4px 10px;
    background: ${background};
    color: #fff;
    font: 600 12px/1.3 sans-serif;
  `;
  button.addEventListener('click', onClick);
  return button;
};

const buildRoutePopupContent = (
  route: EditableRoute,
  onEdit: () => void,
  onReturnToLine: (() => void) | null,
  onReturnToOriginal: (() => void) | null,
) => {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

  const title = document.createElement('div');
  title.textContent = [route.name, route.grade].filter(Boolean).join('  ');
  title.style.cssText =
    'font:600 13px/1.3 sans-serif;color:#4150a0;white-space:nowrap;';

  container.appendChild(title);
  container.appendChild(
    buildPopupButton(t('climbing.edit_this_route'), '#4150a0', onEdit),
  );
  if (onReturnToLine) {
    container.appendChild(
      buildPopupButton(t('climbing.return_to_line'), '#e8833a', onReturnToLine),
    );
  }
  if (onReturnToOriginal) {
    container.appendChild(
      buildPopupButton(
        t('climbing.return_to_original'),
        '#6b6b6b',
        onReturnToOriginal,
      ),
    );
  }
  return container;
};

const buildControlPointPopupContent = (onDelete: () => void) => {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
  container.appendChild(
    buildPopupButton(t('climbing.delete_point'), '#c0392b', onDelete),
  );
  return container;
};

type DisplayOptions = {
  showNames?: boolean;
  showGrades?: boolean;
};

export const useCragRoutePositionEditor = (
  mapRef: React.MutableRefObject<maplibregl.Map>,
  isMapLoaded: boolean,
  styleEpoch: number,
  { showNames = true, showGrades = true }: DisplayOptions = {},
) => {
  const { feature: crag } = useFeatureContext();
  const { items, addItem, setCurrent, current } = useEditContext();
  const theme = useTheme();
  const themeMode = (theme as any)?.palette?.mode === 'dark' ? 'dark' : 'light';

  // The crag whose routes we draw — resolved from the EditContext so it works
  // for freshly created sectors too (where the FeatureContext still points at
  // the original node, not the new relation that holds the routes).
  const cragItem = useMemo(
    () => findCragItemForRoutes(items, current, crag),
    [items, current, crag],
  );

  const editableRoutes = useMemo(
    () => getEditableRoutes(crag, cragItem, items),
    [crag, cragItem, items],
  );

  // A signature that only changes when the *set* of routes (or their labels)
  // changes — not on every position edit — so the marker layer isn't rebuilt
  // (and popups closed) on each drag.
  const routesSignature = editableRoutes
    .map((route) => `${route.id}:${route.name}:${route.grade}`)
    .join('|');

  const [isGuideMode, setIsGuideMode] = useState(false);
  const [controlPoints, setControlPoints] = useState<LonLat[]>([]);
  // Routes that the user dragged by hand keep their position and are excluded
  // from the line redistribution (until reset with a right-click). The stored
  // value is the manual position so markers don't flicker back to the original
  // spot while the EditContext item is being (asynchronously) persisted.
  const [manualRoutePositions, setManualRoutePositions] = useState<
    Record<string, LonLat>
  >({});

  const controlMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeMarkersRef = useRef<Record<string, maplibregl.Marker>>({});

  // Keep the latest EditContext data accessible from imperative map handlers.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const controlPointsRef = useRef(controlPoints);
  controlPointsRef.current = controlPoints;
  const manualRoutePositionsRef = useRef(manualRoutePositions);
  manualRoutePositionsRef.current = manualRoutePositions;

  const getEffectivePosition = useCallback(
    (route: EditableRoute): LonLat | undefined => {
      const manual = manualRoutePositionsRef.current[route.id];
      if (manual) return manual;
      const item = findInItems(itemsRef.current, route.id);
      return (item?.nodeLonLat as LonLat | undefined) ?? route.originalLonLat;
    },
    [],
  );

  // Persists one route's position into the EditContext (local, not OSM). The
  // dialog's own Save button is what eventually writes it to OSM.
  const persistRoutePosition = useCallback(
    async (route: EditableRoute, lonLat: LonLat) => {
      if (!route.isNode) return;
      const existing = findInItems(itemsRef.current, route.id);
      if (existing) {
        existing.setNodeLonLat(lonLat);
        return;
      }
      const fresh = await fetchFreshItem(getApiId(route.id));
      addItem({ ...fresh, nodeLonLat: lonLat });
    },
    [addItem],
  );

  // Snap a route back where it belongs (onto the guide line, or to its
  // original position when there is no line) and drop its manual override.
  const resetRouteToLine = useCallback(
    (route: EditableRoute, index: number) => {
      const livePoints = controlPointsRef.current;
      const distributed =
        livePoints.length >= 2
          ? distributeAlongControlPoints(livePoints, editableRoutes.length)[
              index
            ]
          : route.originalLonLat;
      setManualRoutePositions((prev) => {
        if (!prev[route.id]) return prev;
        const next = { ...prev };
        delete next[route.id];
        return next;
      });
      if (distributed) persistRoutePosition(route, distributed);
    },
    [editableRoutes, persistRoutePosition],
  );

  // Revert a route to its original (OSM) position. Pin it as a manual override
  // so it stays put even when a guide line is active (otherwise the line
  // distribution would immediately drag it back onto the line).
  const resetRouteToOriginal = useCallback(
    (route: EditableRoute) => {
      if (!route.isNode || !route.originalLonLat) return;
      const original = route.originalLonLat;
      setManualRoutePositions((prev) => ({ ...prev, [route.id]: original }));
      persistRoutePosition(route, original);
    },
    [persistRoutePosition],
  );

  const distributedPositions = useMemo(
    () =>
      controlPoints.length >= 2
        ? distributeAlongControlPoints(controlPoints, editableRoutes.length)
        : null,
    [controlPoints, editableRoutes.length],
  );

  // Writes the distributed positions of *all* routes into the EditContext.
  const persistDistribution = useCallback(
    async (points: LonLat[]) => {
      if (points.length < 2) return;
      const positions = distributeAlongControlPoints(
        points,
        editableRoutes.length,
      );

      const isManual = (id: string) => !!manualRoutePositionsRef.current[id];

      const missing = editableRoutes.filter(
        (route) =>
          route.isNode &&
          !isManual(route.id) &&
          !isInItems(itemsRef.current, route.id),
      );
      const freshItems = await Promise.all(
        missing.map((route) => fetchFreshItem(getApiId(route.id))),
      );
      missing.forEach((route, k) => {
        const index = editableRoutes.indexOf(route);
        addItem({ ...freshItems[k], nodeLonLat: positions[index] });
      });

      editableRoutes.forEach((route, index) => {
        if (!route.isNode || isManual(route.id)) return;
        const existing = findInItems(itemsRef.current, route.id);
        if (existing) existing.setNodeLonLat(positions[index]);
      });
    },
    [editableRoutes, addItem],
  );

  const clearGuide = useCallback(() => {
    // Reset every route back to its original position (revert the locally
    // stored line distribution / manual drags).
    editableRoutes.forEach((route) => {
      if (!route.isNode || !route.originalLonLat) return;
      const item = findInItems(itemsRef.current, route.id);
      if (item) item.setNodeLonLat(route.originalLonLat);
    });
    setControlPoints([]);
    setManualRoutePositions({});
    setIsGuideMode(false);
  }, [editableRoutes]);

  // Ensure the dashed guide line source + layer exist (also after style swap).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    if (!map.getSource(LINE_SOURCE_ID)) {
      map.addSource(LINE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!map.getLayer(LINE_LAYER_ID)) {
      map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: LINE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#4150a0',
          'line-width': 2.5,
          'line-dasharray': [2, 1],
        },
      });
    }
  }, [mapRef, isMapLoaded, styleEpoch]);

  // Add a guide point on map click (only while drawing the line). Clicking on
  // the existing line inserts a point in between; clicking a marker is ignored.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !isGuideMode) return undefined;

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const target = e.originalEvent?.target as HTMLElement | null;
      if (target?.closest('.maplibregl-marker')) return;

      const clicked: LonLat = [e.lngLat.lng, e.lngLat.lat];
      const livePoints = controlPointsRef.current;

      const onLine =
        livePoints.length >= 2 &&
        map.queryRenderedFeatures(e.point, { layers: [LINE_LAYER_ID] }).length >
          0;

      let updated: LonLat[];
      if (onLine) {
        const snapped = nearestPointOnLine(lineString(livePoints), clicked);
        const segmentIndex = (snapped.properties.index ?? 0) as number;
        updated = [
          ...livePoints.slice(0, segmentIndex + 1),
          clicked,
          ...livePoints.slice(segmentIndex + 1),
        ];
      } else {
        updated = [...livePoints, clicked];
      }
      setControlPoints(updated);
      persistDistribution(updated);
    };

    const onLineEnter = () => {
      map.getCanvas().style.cursor = 'copy';
    };
    const onLineLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', onClick);
    map.on('mouseenter', LINE_LAYER_ID, onLineEnter);
    map.on('mouseleave', LINE_LAYER_ID, onLineLeave);
    return () => {
      map.off('click', onClick);
      map.off('mouseenter', LINE_LAYER_ID, onLineEnter);
      map.off('mouseleave', LINE_LAYER_ID, onLineLeave);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, isMapLoaded, isGuideMode, persistDistribution]);

  // Create / destroy guide point markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return undefined;

    controlMarkersRef.current.forEach((marker) => marker.remove());
    controlMarkersRef.current = [];

    if (!isGuideMode) return undefined;

    controlMarkersRef.current = controlPoints.map((point, index) => {
      const element = buildControlPointElement(String(index + 1));
      const marker = new maplibregl.Marker({ element, draggable: true })
        .setLngLat(point)
        .addTo(map);

      const deletePoint = () => {
        const next = controlPointsRef.current.filter((_, i) => i !== index);
        setControlPoints(next);
        persistDistribution(next);
      };

      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: false,
      }).setDOMContent(
        buildControlPointPopupContent(() => {
          popup.remove();
          deletePoint();
        }),
      );
      marker.setPopup(popup);

      marker.on('drag', () => {
        const { lng, lat } = marker.getLngLat();
        setControlPoints((prev) => {
          const next = [...prev];
          next[index] = [lng, lat];
          return next;
        });
      });
      marker.on('dragend', () => {
        persistDistribution(controlPointsRef.current);
      });

      element.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        deletePoint();
      });

      return marker;
    });

    return () => {
      controlMarkersRef.current.forEach((marker) => marker.remove());
      controlMarkersRef.current = [];
    };
    // controlPoints.length (not the array) intentionally drives re-creation so
    // dragging an existing point doesn't tear down the marker mid-drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapRef,
    isMapLoaded,
    isGuideMode,
    controlPoints.length,
    persistDistribution,
  ]);

  // Keep the dashed line in sync with the guide points.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    const source = map.getSource(LINE_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!source) return;
    source.setData({
      type: 'FeatureCollection',
      features:
        isGuideMode && controlPoints.length >= 2
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: controlPoints },
              },
            ]
          : [],
    });
  }, [mapRef, isMapLoaded, isGuideMode, controlPoints, styleEpoch]);

  // Create the always-on route markers (colored by difficulty, draggable,
  // clickable to jump into editing that route).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return undefined;

    Object.values(routeMarkersRef.current).forEach((marker) => marker.remove());
    routeMarkersRef.current = {};

    editableRoutes.forEach((route, index) => {
      const color = getDifficultyColor(route.difficulty, themeMode);
      const element = buildRouteMarkerElement(
        index + 1,
        route.name,
        route.grade,
        color,
        route.id === current,
        showNames,
        showGrades,
      );
      const candidatePosition = getEffectivePosition(route) ?? crag.center;
      const initialPosition = isValidLonLat(candidatePosition)
        ? candidatePosition
        : map.getCenter();
      const marker = new maplibregl.Marker({
        element,
        draggable: true,
        anchor: 'left',
      })
        .setLngLat(initialPosition)
        .addTo(map);

      const onEdit = async () => {
        if (!isInItems(itemsRef.current, route.id)) {
          const fresh = await fetchFreshItem(getApiId(route.id));
          addItem(fresh);
        }
        setCurrent(route.id);
      };

      const popup = new maplibregl.Popup({ offset: 16, closeButton: false });
      // Rebuild the content on every open so the "return to line" action only
      // shows up while the route actually sits off the guide line.
      popup.on('open', () => {
        const isOffLine =
          controlPointsRef.current.length >= 2 &&
          !!manualRoutePositionsRef.current[route.id];
        const movedFromOriginal =
          !!route.originalLonLat &&
          !isSamePosition(getEffectivePosition(route), route.originalLonLat);
        popup.setDOMContent(
          buildRoutePopupContent(
            route,
            () => {
              popup.remove();
              onEdit();
            },
            isOffLine
              ? () => {
                  popup.remove();
                  resetRouteToLine(route, index);
                }
              : null,
            movedFromOriginal
              ? () => {
                  popup.remove();
                  resetRouteToOriginal(route);
                }
              : null,
          ),
        );
      });
      marker.setPopup(popup);

      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        setManualRoutePositions((prev) => ({
          ...prev,
          [route.id]: [lng, lat],
        }));
        persistRoutePosition(route, [lng, lat]);
      });

      // Right-click a moved route to snap it back onto the line.
      element.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        resetRouteToLine(route, index);
      });

      routeMarkersRef.current[route.id] = marker;
    });

    return () => {
      Object.values(routeMarkersRef.current).forEach((marker) =>
        marker.remove(),
      );
      routeMarkersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapRef,
    isMapLoaded,
    routesSignature,
    crag.center,
    themeMode,
    current,
    showNames,
    showGrades,
  ]);

  // Move route markers to their current effective positions (live distribution
  // while drawing the line, otherwise the locally-stored EditContext position).
  useEffect(() => {
    editableRoutes.forEach((route, index) => {
      const marker = routeMarkersRef.current[route.id];
      if (!marker) return;
      const isOffLine =
        !!distributedPositions && !!manualRoutePositions[route.id];
      const useDistribution =
        isGuideMode && distributedPositions && !manualRoutePositions[route.id];
      const position = useDistribution
        ? distributedPositions[index]
        : getEffectivePosition(route);
      if (isValidLonLat(position)) marker.setLngLat(position);

      // Mark routes that sit off the guide line (manually moved away from it).
      const dot = marker
        .getElement()
        .querySelector('.crag-route-dot') as HTMLElement | null;
      if (dot) {
        dot.style.outline = isOffLine ? '2px dashed #e8833a' : '';
        dot.style.outlineOffset = isOffLine ? '2px' : '';
      }
    });
  }, [
    editableRoutes,
    isGuideMode,
    distributedPositions,
    manualRoutePositions,
    items,
    getEffectivePosition,
  ]);

  return {
    isGuideMode,
    setIsGuideMode,
    controlPoints,
    clearGuide,
    hasRoutes: editableRoutes.length > 0,
  };
};

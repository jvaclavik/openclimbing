import {
  LayerSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import { AREA, CLIMBING_TILES_SOURCE, CRAG, GYM, VIA_FERRATA } from '../consts';
import {
  byHasImages,
  hover,
  ifArea,
  ifCrag,
  linear,
  linearByRouteCount,
  sortKey,
} from './helpers';

const areaSize = linearByRouteCount(0, 0.4, 400, 1);
const cragSize = linearByRouteCount(0, 0.4, 50, 0.7);
const cragSizeBig = 0.7;

// Below this zoom areas win label collisions over their child crags; from here
// crags take priority (routes appear ~z13). Areas stay on the map either way —
// they still render when collision detection finds room.
const AREA_HANDOVER_ZOOM = 13;

// dominates routeCount / hasImages, so the type decides the collision first
const TYPE_PRIORITY = 1000000;

// an area and its only crag share the same center and routeCount, so without
// this the winner of the collision is arbitrary (so far the crag, at all zooms)
const groupsSortKey = [
  'step',
  ['zoom'],
  sortKey(ifArea(TYPE_PRIORITY, 0)),
  AREA_HANDOVER_ZOOM,
  sortKey(ifArea(0, TYPE_PRIORITY)),
] as DataDrivenPropertyValueSpecification<number>;

const GROUPS_LAYOUT: SymbolLayerSpecification['layout'] = {
  'icon-image': ifCrag(byHasImages(CRAG, 'IMAGE'), byHasImages(AREA, 'IMAGE')),
  'icon-size': linear(
    6,
    0.4,
    8,
    ifCrag(cragSize, areaSize),
    21,
    ifCrag(cragSizeBig, areaSize),
  ),
  'text-size': linear(
    5,
    ifCrag(12, 12),
    15,
    ifCrag(12, 14),
    21,
    ifCrag(15, 14),
  ),
  'text-offset': [0, 0.6],
  'icon-optional': false,
  'icon-ignore-placement': false,
  'icon-allow-overlap': ['step', ['zoom'], true, 4, false, 15, true],
  'text-field': ['step', ['zoom'], '', 4, ['get', 'label']],
  'text-padding': 2,
  'text-font': ['Noto Sans Bold'],
  'text-anchor': 'top',
  'text-max-width': 9,
  'text-ignore-placement': false,
  'text-allow-overlap': false,
  'text-optional': true,
  'symbol-sort-key': groupsSortKey,
};

export const groupsLayer: LayerSpecification = {
  id: 'climbing group',
  metadata: { clickableWithOsmId: true },
  type: 'symbol',
  source: CLIMBING_TILES_SOURCE,
  minzoom: 1,
  maxzoom: 22,
  filter: [
    'any',
    ['==', ['get', 'type'], 'crag'],
    ['==', ['get', 'type'], 'area'],
  ],
  layout: GROUPS_LAYOUT,
  paint: {
    'icon-opacity': hover(1, 0.6),
    'text-opacity': hover(1, 0.6),
    'text-color': ifCrag(
      byHasImages(CRAG, 'COLOR'),
      byHasImages(AREA, 'COLOR'),
    ),
    'text-halo-color': '#ffffff',
    'text-halo-width': 2,
  },
};

export const gymsLayer: LayerSpecification = {
  ...groupsLayer,
  id: 'climbing gym',
  filter: ['==', 'type', 'gym'],
  layout: {
    ...groupsLayer.layout,
    'icon-image': GYM.IMAGE,
    'symbol-sort-key': sortKey(),
  },
};

export const ferrataLayer: LayerSpecification = {
  ...groupsLayer,
  id: 'climbing via_ferrata',
  filter: ['==', 'type', 'ferrata'],
  layout: {
    ...groupsLayer.layout,
    'icon-image': VIA_FERRATA.IMAGE,
    'symbol-sort-key': sortKey(),
  },
};

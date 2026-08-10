import {
  ExpressionSpecification,
  LayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import { CLIMBING_TILES_SOURCE } from '../consts';
import { linear } from './helpers';

// route on the clicked photo
const ifHighlighted = (
  highlighted: number,
  basic: number,
): ExpressionSpecification => [
  'case',
  ['boolean', ['feature-state', 'highlighted'], false],
  highlighted,
  basic,
];

export const CRAG_ROUTES_LAYER = 'climbing route (crag highlight)';

// circle-blur fades the disc from its edge inwards, so the ring has to start
// wider to keep a visible thickness
const HALO = 1.6;

export const routesPoints: LayerSpecification[] = [
  {
    // an orange disc peeking from under the white ring - maplibre has no second
    // stroke on a circle, so the ring has to be a layer of its own
    id: CRAG_ROUTES_LAYER,
    type: 'circle',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 13,
    filter: ['==', ['get', 'parentId'], -1], // set by setSelectedCragRoutes()
    paint: {
      'circle-color': '#ffa569',
      'circle-opacity': 0.85,
      'circle-blur': 1,
      // route radius + its white stroke + the ring itself
      'circle-radius': linear(
        16,
        ifHighlighted((2 + 2 + 1.5) * HALO, (1 + 0.4 + 1.5) * HALO),
        21,
        ifHighlighted((8 + 5 + 3) * HALO, (6 + 1.2 + 3) * HALO),
      ),
    },
  },
  {
    id: 'climbing route (circle)',
    metadata: { clickableWithOsmId: true },
    type: 'circle',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 13,
    filter: [
      'all',
      ['in', 'type', 'route', 'route_top'],
      ['==', '$type', 'Point'],
    ],
    paint: {
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#000',
        ['coalesce', ['get', 'color'], '#999'],
      ],
      // highlighted (route on the clicked photo) grows its coloured centre a bit
      'circle-radius': linear(16, ifHighlighted(2, 1), 21, ifHighlighted(8, 6)),
      'circle-stroke-color': '#ffffff',
      // routes drawn on the currently highlighted photo keep their difficulty
      // colour and same-sized centre, but get a bigger white ring around them.
      // zoom must stay top-level, so the highlighted `case` goes in the outputs
      'circle-stroke-width': linear(
        16,
        ifHighlighted(2, 0.4),
        21,
        ifHighlighted(5, 1.2),
      ),
    },
  },
  {
    id: 'climbing route (label)',
    metadata: { clickableWithOsmId: true },
    type: 'symbol',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 19,
    filter: ['in', 'type', 'route', 'route_top'],
    layout: {
      'text-padding': 2,
      'text-font': ['Noto Sans Medium'],
      'text-anchor': 'left',
      'text-field': '{label}',
      'text-offset': [1, 0],
      'text-size': linear(20, 12, 26, 30),
      'text-max-width': 9,
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-halo-blur': 0.5,
      'text-color': [
        'case',
        ['boolean', ['feature-state', 'highlighted'], false],
        '#222',
        '#666',
      ],
      'text-halo-width': [
        'case',
        ['boolean', ['feature-state', 'highlighted'], false],
        2,
        1,
      ],
      'text-halo-color': '#ffffff',
    },
  },
];

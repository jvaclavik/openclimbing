import { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { CLIMBING_TILES_SOURCE } from '../consts';
import { linear } from './helpers';

export const routesPoints: LayerSpecification[] = [
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
      'circle-radius': linear(
        16,
        ['case', ['boolean', ['feature-state', 'highlighted'], false], 2, 1],
        21,
        ['case', ['boolean', ['feature-state', 'highlighted'], false], 8, 6],
      ),
      'circle-stroke-color': '#ffffff',
      // routes drawn on the currently highlighted photo keep their difficulty
      // colour and same-sized centre, but get a bigger white ring around them.
      // zoom must stay top-level, so the highlighted `case` goes in the outputs
      'circle-stroke-width': linear(
        16,
        ['case', ['boolean', ['feature-state', 'highlighted'], false], 2, 0.4],
        21,
        ['case', ['boolean', ['feature-state', 'highlighted'], false], 5, 1.2],
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

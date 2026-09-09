import { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { CLIMBING_TILES_SOURCE, VIA_FERRATA } from '../consts';

export const ferrataLines: LayerSpecification[] = [
  {
    id: 'climbing via_ferrata (line) - casing',
    metadata: { clickableWithOsmId: true },
    type: 'line',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 13,
    filter: ['==', 'type', 'ferrata'],
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': '#f8f4f0',
      'line-width': 4,
    },
  },
  {
    id: 'climbing via_ferrata (line)',
    metadata: { clickableWithOsmId: true },
    type: 'line',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 13,
    filter: ['==', 'type', 'ferrata'],
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': VIA_FERRATA.COLOR,
      'line-width': 2,
      'line-dasharray': [2, 1],
    },
  },
  {
    id: 'climbing via_ferrata (line) - hover',
    metadata: { clickableWithOsmId: true },
    type: 'line',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 13,
    filter: ['==', 'type', 'ferrata'],
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': '#000',
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0,
      ],
      'line-width': 2,
    },
  },
];

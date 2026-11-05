import {
  FilterSpecification,
  LayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import { CLIMBING_TILES_SOURCE, VIA_FERRATA } from '../consts';
import { linear } from './helpers';

const ferrataGeometry = (
  geometry: 'Point' | 'LineString',
): FilterSpecification => [
  'all',
  ['==', 'type', 'ferrata'],
  ['==', '$type', geometry],
];

export const ferrataLines: LayerSpecification[] = [
  {
    id: 'climbing via_ferrata (point)',
    metadata: { clickableWithOsmId: true },
    type: 'circle',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 3,
    filter: ferrataGeometry('Point'),
    paint: {
      'circle-color': VIA_FERRATA.COLOR,
      'circle-radius': linear(4, 3.5, 10, 6, 14, 8),
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff8ee',
      'circle-opacity': 0.95,
    },
  },
  {
    id: 'climbing via_ferrata (line) - casing',
    metadata: { clickableWithOsmId: true },
    type: 'line',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 11,
    filter: ferrataGeometry('LineString'),
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#fff8ee',
      'line-width': 7,
    },
  },
  {
    id: 'climbing via_ferrata (line)',
    metadata: { clickableWithOsmId: true },
    type: 'line',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 11,
    filter: ferrataGeometry('LineString'),
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': VIA_FERRATA.COLOR,
      'line-width': 3.5,
      'line-dasharray': [1.2, 0.9],
    },
  },
  {
    id: 'climbing via_ferrata (line) - hover',
    metadata: { clickableWithOsmId: true },
    type: 'line',
    source: CLIMBING_TILES_SOURCE,
    minzoom: 11,
    filter: ferrataGeometry('LineString'),
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#000',
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0,
      ],
      'line-width': 3.5,
    },
  },
];

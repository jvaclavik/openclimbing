import { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { routesLines } from './routesLines';
import { ferrataLines } from './ferrataLines';
import { ferrataLayer, groupsLayer, gymsLayer } from './groupsLayer';
import { routesPoints } from './routesPoints';
import { outlinesLayer } from './outlinesLayer';

export const climbingLayers: LayerSpecification[] = [
  outlinesLayer,
  ...routesLines,
  ...ferrataLines,
  ...routesPoints,
  gymsLayer,
  ferrataLayer,
  groupsLayer,
];

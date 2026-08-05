import {
  ExpressionInputType,
  ExpressionSpecification,
  LayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import { CLIMBING_TILES_SOURCE } from '../consts';

const HOVER: ExpressionSpecification = [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  1,
  0,
];

const SHOULD_SHOW: ExpressionInputType | ExpressionSpecification =
  global.window?.localStorage.getItem('show_all_climbing_outlines') === 'true'
    ? 1
    : HOVER;

// feature opened in the FeaturePanel - it stays lit regardless of hover/zoom
const SELECTED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'selected'],
  false,
];

// a missing/null minZoom would throw and maplibre would silently fall back to
// the default line-opacity of 1 - i.e. the outline lit up all the time
const MIN_ZOOM: ExpressionSpecification = ['coalesce', ['get', 'minZoom'], 99];

const BY_ZOOM = (z: number): ExpressionSpecification => [
  'case',
  SELECTED,
  1,
  ['>', z, MIN_ZOOM],
  SHOULD_SHOW,
  0,
];

// ['zoom'] must stay the input of a top-level 'step', hence the per-zoom cases
const zoomSpec = Array.from({ length: 22 }, (_, z) => [z, BY_ZOOM(z)]).flat();

export const outlinesLayer: LayerSpecification = {
  id: 'climbing outline',
  // metadata: { clickableWithOsmId: true },
  type: 'line',
  source: CLIMBING_TILES_SOURCE,
  filter: ['==', 'type', 'outline'],
  layout: { 'line-cap': 'round' },
  paint: {
    'line-color': '#f60',
    'line-width': ['case', SELECTED, 3, 2],
    'line-opacity': ['step', ['zoom'], 0, ...zoomSpec],
  },
};

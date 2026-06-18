import type {
  ExpressionSpecification,
  LayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';

// `natural=rock` is not part of the OpenMapTiles/MapTiler vector tiles, so it is
// fetched separately from Overpass (see `naturalRockSource.ts`) and rendered
// from this dedicated GeoJSON source. It mirrors how rocks already look on the
// tourist map: the light-grey `landcover_rock` fill plus the grey edge line of
// `cliffsLayers`.
export const NATURAL_ROCK_SOURCE = 'natural_rock';

const ROCK_FILL = 'rgba(235, 235, 235, 1)';
const LABEL_COLOR = 'rgba(70, 70, 70, 1)';
const HALO = 'rgba(248, 248, 248, 0.92)';

// Same grey ramp as cliffsLayers (`hsla(0,0%,50%,0.5)` → `hsl(0,0%,58%)`).
const ROCK_LINE: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13,
  'hsla(0, 0%, 50%, 0.5)',
  17,
  'hsl(0, 0%, 58%)',
];

export const naturalRockLayers: LayerSpecification[] = [
  {
    id: 'natural-rock-fill',
    type: 'fill',
    source: NATURAL_ROCK_SOURCE,
    filter: ['==', '$type', 'Polygon'],
    metadata: { clickableWithOsmId: true },
    paint: {
      'fill-color': ROCK_FILL,
      'fill-antialias': true,
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.75,
        1,
      ],
    },
  } as LayerSpecification,
  {
    id: 'natural-rock-outline',
    type: 'line',
    source: NATURAL_ROCK_SOURCE,
    filter: ['==', '$type', 'Polygon'],
    metadata: { clickableWithOsmId: true },
    layout: {
      'line-cap': 'butt',
      'line-join': 'miter',
      'line-miter-limit': 2,
    },
    paint: {
      'line-color': ROCK_LINE,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.3, 22, 2.5],
    },
  } as LayerSpecification,
  {
    id: 'natural-rock-circle',
    type: 'circle',
    source: NATURAL_ROCK_SOURCE,
    filter: ['==', '$type', 'Point'],
    metadata: { clickableWithOsmId: true },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 2.5, 18, 5],
      'circle-color': ROCK_LINE,
      'circle-stroke-color': HALO,
      'circle-stroke-width': 1,
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.6,
        1,
      ],
    },
  } as LayerSpecification,
  {
    id: 'natural-rock-label',
    type: 'symbol',
    source: NATURAL_ROCK_SOURCE,
    minzoom: 14,
    metadata: { clickableWithOsmId: true },
    layout: {
      'text-field': '{name}',
      'text-font': ['Roboto Condensed Italic', 'Noto Sans Italic'],
      'text-size': 11,
      'text-anchor': 'top',
      'text-offset': [0, 0.5],
      'text-max-width': 8,
      'text-optional': true,
      'symbol-placement': 'point',
    },
    paint: {
      'text-color': LABEL_COLOR,
      'text-halo-color': HALO,
      'text-halo-width': 1.2,
      'text-halo-blur': 0.4,
    },
  } as LayerSpecification,
];

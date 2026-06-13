import cloneDeep from 'lodash/cloneDeep';
import { StyleSpecification } from 'maplibre-gl';
import { outdoorStyle } from './outdoorStyle';

// "Tourist" reuses the geometry/labels of `outdoorStyle` but re-tints a handful
// of layers so the result resembles the classic Czech "turistická mapa" look
// known from mapy.com: a warm paper background, saturated forest greens, a
// strong shaded relief, readable brown contour lines, casing-outlined roads
// colored by importance (white / yellow / olive-green) and brown dashed paths.

type Paint = Record<string, unknown>;
type Layout = Record<string, unknown>;
type AnyLayer = {
  id: string;
  paint?: Paint;
  layout?: Layout;
  [key: string]: unknown;
};

// Country labels – bold, prominent, ideally the Piazzolla serif (falls back to
// the bundled bold sans if Piazzolla is not available on the glyph server).
const COUNTRY_LABEL_PAINT: Paint = {
  'text-color': 'rgba(43, 40, 40, 1)',
  'text-halo-color': 'rgba(248, 248, 242, 0.95)',
  'text-halo-width': 1.8,
  'text-halo-blur': 1,
};
const COUNTRY_LABEL_LAYOUT: Layout = {
  'text-font': ['Noto Sans Bold'],
  'text-transform': 'uppercase',
  'text-letter-spacing': 0.14,
};

// Per-layer paint overrides applied on top of the cloned outdoor style.
const PAINT_OVERRIDES: Record<string, Paint> = {
  background: {
    'background-color': '#EFEEE0',
  },

  // Forests / woodland
  landcover_wood: {
    'fill-color': '#C1DC9E',
    'fill-opacity': 1,
  },
  globallandcover_tree: {
    'fill-color': '#C1DC9E',
  },
  globallandcover_forest: {
    'fill-color': '#C1DC9E',
  },

  // Urban areas / industry
  landuse_residential: {
    // Warm brown/tan like mapy.cz, but a touch darker/more saturated so the
    // yellow/orange/white roads still stand out against the built-up areas.
    'fill-color': '#D8C49E',
    'fill-opacity': {
      stops: [
        [7, 0.95],
        [12, 0.85],
        [16, 0.7],
      ],
    },
  },
  landuse_industrial: {
    'fill-color': '#D9D7CF',
    'fill-opacity': 0.85,
  },

  // Buildings – clearly darker than the residential fill for contrast
  building: {
    'fill-color': '#C6A977',
  },
  'building-top': {
    'fill-color': '#C6A977',
    'fill-outline-color': '#9C8052',
  },
  'building-3d': {
    'fill-extrusion-color': '#BA9D6C',
  },

  // Strong, warm shaded relief – the signature of the mapy.com tourist map
  hillshade: {
    'hillshade-accent-color': 'rgba(150, 128, 100, 0.6)',
    'hillshade-exaggeration': {
      stops: [
        [5, 0.3],
        [9, 0.5],
        [12, 0.7],
        [13, 0.85],
        [16, 0.9],
      ],
    },
    'hillshade-shadow-color': 'rgba(92, 74, 54, 0.92)',
    'hillshade-highlight-color': 'rgba(255, 250, 234, 0.5)',
  },

  // Contour lines – more visible and browner
  contour_index: {
    'line-color': 'rgba(166, 118, 48, 1)',
    'line-width': {
      stops: [
        [10, 1],
        [14, 1.6],
      ],
    },
    'line-opacity': {
      stops: [
        [10, 0.7],
        [14, 0.65],
      ],
    },
  },
  contour: {
    'line-color': 'rgba(166, 118, 48, 1)',
    'line-opacity': {
      stops: [
        [10, 0.5],
        [14, 0.5],
      ],
    },
  },
  contour_label: {
    'text-color': 'rgba(138, 109, 59, 1)',
  },

  // Water
  water: {
    'fill-color': '#94BBDA',
  },
  water_intermittent: {
    'fill-color': '#94BBDA',
  },
  waterway_river: {
    'line-color': '#94BBDA',
  },
  waterway_other: {
    'line-color': '#94BBDA',
  },

  // Footpaths / hiking paths – brownish grey, thinner, dashed
  road_path: {
    'line-color': '#9B9070',
    'line-width': {
      base: 1.2,
      stops: [
        [14, 0.4],
        [16, 1],
        [20, 1.6],
      ],
    },
    'line-dasharray': [2, 1.6],
  },

  // Cycle routes – magenta/pink, dotted
  bicycle_local: {
    'line-color': '#E84CC0',
    'line-dasharray': [0.5, 2.5],
  },
  bicycle_longdistance: {
    'line-color': '#E84CC0',
    'line-dasharray': [0.5, 2.5],
  },

  // Marked hiking routes (KČT signs)
  trail_red: { 'line-color': '#C5060A' },
  trail_red_extra: { 'line-color': '#C5060A' },
  trail_yellow: { 'line-color': '#DAC020' },
  trail_yellow_extra: { 'line-color': '#DAC020' },
  trail_green: { 'line-color': '#1F8508' },
  trail_green_extra: { 'line-color': '#1F8508' },
  trail_blue: { 'line-color': '#0B22BB' },

  // Railway – white base (gray casing + gray dashes added as separate layers)
  road_rail: {
    'line-color': '#FFFFFF',
    'line-width': {
      base: 1.4,
      stops: [
        [8, 0.8],
        [14, 1.6],
        [18, 3],
        [20, 3.8],
      ],
    },
  },

  // Roads colored by importance (casings + the orange primary tier are injected
  // as separate layers below)
  road_minor: {
    'line-color': '#FFFFFF',
  },
  road_major: {
    'line-color': '#F5EA6C',
    'line-width': {
      base: 1.2,
      stops: [
        [8, 0.8],
        [11, 1.6],
        [14, 4],
        [18, 14],
        [22, 16],
      ],
    },
  },
  road_motorway: {
    'line-color': '#97D26C',
    'line-width': {
      base: 1.2,
      stops: [
        [5, 1],
        [8, 2],
        [11, 3],
        [14, 5],
        [18, 16],
        [22, 18],
      ],
    },
  },

  // Country borders – bold violet line in the Czech KČT manner (a soft violet
  // band is added underneath as a separate layer below)
  boundary_country: {
    'line-color': '#7C4A93',
    'line-width': {
      base: 1,
      stops: [
        [0, 0.6],
        [5, 1.4],
        [8, 2.2],
        [12, 4],
      ],
    },
    'line-opacity': {
      base: 1,
      stops: [
        [0, 0.35],
        [5, 0.6],
        [8, 0.85],
        [12, 1],
      ],
    },
    'line-dasharray': [4, 2],
  },

  // City labels – thicker text outline (halo)
  'place-city': {
    'text-halo-width': 2.4,
    'text-halo-color': 'rgba(255, 255, 255, 0.92)',
  },
  'place-capital': {
    'text-halo-width': 2.6,
    'text-halo-color': 'rgba(255, 255, 255, 0.92)',
  },

  // Country labels – darker and with a stronger halo to stand out
  country_other: COUNTRY_LABEL_PAINT,
  country_rank_3: COUNTRY_LABEL_PAINT,
  'country_rank_1-2': COUNTRY_LABEL_PAINT,
};

// Narrow the yellow "major" tier (and its casing) to secondary/tertiary so the
// orange primary/trunk tier can sit on top of it.
const MAJOR_YELLOW_FILTER = [
  'all',
  ['in', 'class', 'secondary', 'tertiary'],
  ['!=', 'brunnel', 'tunnel'],
];
const PRIMARY_ORANGE_FILTER = [
  'all',
  ['in', 'class', 'primary', 'trunk'],
  ['!=', 'brunnel', 'tunnel'],
];

const FILTER_OVERRIDES: Record<string, unknown> = {
  road_major: MAJOR_YELLOW_FILTER,
};

// Per-layer layout overrides – bolder town/city labels, big cities in caps.
const LAYOUT_OVERRIDES: Record<string, Layout> = {
  // Hide the low-zoom long-distance hiking/cycle routes (from the separate
  // `outdoor` source) – they show up before the maptiler basemap when zoomed out.
  trail_longdistance: { visibility: 'none' },
  trail_longdistance_casing: { visibility: 'none' },
  bicycle_longdistance: { visibility: 'none' },
  bicycle_longdistance_casing: { visibility: 'none' },

  // Mountain peaks – small, bold, italic, serif (with sans fallback)
  mountain_peak: {
    'text-font': [
      'Noto Serif Bold Italic',
      'Noto Serif Italic',
      'Roboto Condensed Italic',
    ],
    'text-size': {
      stops: [
        [9, 8],
        [12, 9],
        [15, 11],
      ],
    },
  },

  'place-town': {
    'text-font': ['Roboto Medium', 'Noto Sans Regular'],
  },
  'place-city': {
    'text-font': ['Roboto Bold', 'Noto Sans Bold'],
    'text-transform': 'uppercase',
    'text-letter-spacing': 0.05,
  },
  'place-capital': {
    'text-font': ['Roboto Bold', 'Noto Sans Bold'],
    'text-transform': 'uppercase',
    'text-letter-spacing': 0.05,
  },

  country_other: COUNTRY_LABEL_LAYOUT,
  country_rank_3: COUNTRY_LABEL_LAYOUT,
  'country_rank_1-2': COUNTRY_LABEL_LAYOUT,
};

const roadCasing = (
  id: string,
  lineColor: string,
  widthStops: [number, number][],
  filter: unknown,
  minzoom?: number,
): AnyLayer => ({
  id,
  type: 'line',
  paint: {
    'line-color': lineColor,
    'line-width': { base: 1.2, stops: widthStops },
  },
  filter,
  layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
  source: 'maptiler_planet',
  'source-layer': 'transportation',
  ...(minzoom !== undefined ? { minzoom } : {}),
});

const RAIL_FILTER = [
  'all',
  ['!in', 'brunnel', 'tunnel'],
  ['==', 'class', 'rail'],
];
const RAIL_WIDTH = {
  base: 1.4,
  stops: [
    [8, 0.8],
    [14, 1.6],
    [18, 3],
    [20, 3.8],
  ],
};

// Railway gray casing (the continuous #707070 outline along the white base).
const railCasing: AnyLayer = {
  id: 'road_rail_casing',
  type: 'line',
  paint: {
    'line-color': '#6E6F71',
    'line-width': {
      base: 1.4,
      stops: [
        [8, 1.4],
        [14, 2.8],
        [18, 4.6],
        [20, 5.6],
      ],
    },
  },
  filter: RAIL_FILTER,
  layout: { visibility: 'visible', 'line-join': 'round' },
  source: 'maptiler_planet',
  'source-layer': 'transportation',
};

// Railway gray dashes on top of the white base → alternating gray/white ties.
const railDash: AnyLayer = {
  id: 'road_rail_dash',
  type: 'line',
  paint: {
    'line-color': '#6E6F71',
    'line-width': RAIL_WIDTH,
    'line-dasharray': [3, 3],
  },
  filter: RAIL_FILTER,
  layout: { visibility: 'visible', 'line-join': 'round', 'line-cap': 'butt' },
  source: 'maptiler_planet',
  'source-layer': 'transportation',
};

// Soft violet band drawn under the country border (KČT-style highlight).
const countryBorderBand: AnyLayer = {
  id: 'boundary_country_band',
  type: 'line',
  paint: {
    'line-color': 'rgba(150, 92, 176, 0.28)',
    'line-width': {
      base: 1,
      stops: [
        [5, 2],
        [8, 5],
        [10, 9],
        [12, 13],
        [16, 18],
      ],
    },
    'line-opacity': {
      stops: [
        [5, 0.4],
        [8, 1],
      ],
    },
  },
  // Band only makes sense once zoomed in a bit.
  minzoom: 5,
  filter: [
    'all',
    ['==', 'admin_level', 2],
    ['==', 'maritime', 0],
    ['==', 'disputed', 0],
  ],
  layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
  source: 'maptiler_planet',
  'source-layer': 'boundary',
};

// Casing layers inserted right before the matching road fill layer, giving the
// "colored road with darker outline" look. Filters mirror the originals.
const CASING_BEFORE: Record<string, AnyLayer> = {
  road_rail: railCasing,
  boundary_country: countryBorderBand,
  road_minor: roadCasing(
    'road_minor_casing',
    '#A89C7D',
    [
      [13, 2],
      [18, 14.5],
      [22, 16.5],
    ],
    [
      'all',
      ['!in', 'brunnel', 'tunnel'],
      ['in', 'class', 'minor', 'service', 'pier'],
    ],
    13,
  ),
  road_major: roadCasing(
    'road_major_casing',
    '#C1B233',
    [
      [8, 1.8],
      [11, 2.8],
      [14, 6],
      [18, 16.5],
      [22, 18.5],
    ],
    MAJOR_YELLOW_FILTER,
  ),
  road_motorway: roadCasing(
    'road_motorway_casing',
    '#6FA156',
    [
      [5, 2],
      [8, 3.2],
      [11, 4.4],
      [14, 7],
      [18, 18],
      [22, 20],
    ],
    ['all', ['!in', 'brunnel', 'tunnel'], ['in', 'class', 'motorway']],
    5,
  ),
};

// Orange "primary/trunk" tier – wider than yellow, narrower than motorway.
// Injected (casing + fill) right after the yellow major layer.
const EXTRA_AFTER: Record<string, AnyLayer[]> = {
  road_rail: [railDash],
  road_major: [
    roadCasing(
      'road_primary_casing',
      '#E2A23C',
      [
        [6, 2.2],
        [9, 3.2],
        [11, 4.6],
        [14, 7.5],
        [18, 19.5],
        [22, 21.5],
      ],
      PRIMARY_ORANGE_FILTER,
      6,
    ),
    roadCasing(
      'road_primary',
      '#FBC873',
      [
        [6, 1.2],
        [9, 2],
        [11, 3.2],
        [14, 5.8],
        [18, 17.5],
        [22, 19.5],
      ],
      PRIMARY_ORANGE_FILTER,
      6,
    ),
  ],
};

// Scale a maplibre line-width value (plain number or { stops } function).
const scaleLineWidth = (value: unknown, factor: number): unknown => {
  if (typeof value === 'number') {
    return value * factor;
  }
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { stops?: unknown }).stops)
  ) {
    const fn = value as { stops: [number, unknown][] };
    return {
      ...fn,
      stops: fn.stops.map(([zoom, w]) => [
        zoom,
        typeof w === 'number' ? w * factor : w,
      ]),
    };
  }
  return value;
};

// Marked hiking routes (KČT): a single wider colored line, without the white
// casing/edges, kept offset to run alongside the marked path.
const flattenTrail = (layer: AnyLayer) => {
  if (!layer.id.startsWith('trail_') || !layer.paint) {
    return;
  }
  // Drop the white edges entirely.
  if (layer.id.includes('_casing')) {
    layer.layout = { ...(layer.layout ?? {}), visibility: 'none' };
    return;
  }
  // Widen the colored line (offset beside the path is kept as-is).
  if ('line-width' in layer.paint) {
    layer.paint['line-width'] = scaleLineWidth(layer.paint['line-width'], 1.8);
  }
  // Show the marked routes already from zoom 12.
  layer.minzoom = 12;
};

const applyTouristTint = (style: StyleSpecification): StyleSpecification => {
  const tinted = cloneDeep(style);
  const layers: AnyLayer[] = [];

  for (const layer of tinted.layers as unknown as AnyLayer[]) {
    const casing = CASING_BEFORE[layer.id];
    if (casing) {
      layers.push(cloneDeep(casing));
    }

    flattenTrail(layer);

    const paintOverride = PAINT_OVERRIDES[layer.id];
    if (paintOverride) {
      layer.paint = { ...(layer.paint ?? {}), ...paintOverride };
    }

    const layoutOverride = LAYOUT_OVERRIDES[layer.id];
    if (layoutOverride) {
      layer.layout = { ...(layer.layout ?? {}), ...layoutOverride };
    }

    if (layer.id in FILTER_OVERRIDES) {
      layer.filter = FILTER_OVERRIDES[layer.id];
    }

    layers.push(layer);

    const extra = EXTRA_AFTER[layer.id];
    if (extra) {
      extra.forEach((extraLayer) => layers.push(cloneDeep(extraLayer)));
    }
  }

  tinted.layers = layers as unknown as StyleSpecification['layers'];
  return tinted;
};

export const touristStyle = {
  ...applyTouristTint(outdoorStyle),
  id: 'tourist',
  name: 'Tourist',
} as StyleSpecification;

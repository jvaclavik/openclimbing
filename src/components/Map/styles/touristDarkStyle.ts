import cloneDeep from 'lodash/cloneDeep';
import { StyleSpecification } from 'maplibre-gl';
import { touristStyle } from './touristStyle';

// Night-friendly variant of the tourist map: the base areas (land, forest,
// water, buildings) are darkened to comfortable low-glare tones, labels become
// light with dark halos, and the relief is toned down. The colored roads and
// KČT trail markings are kept as-is – they stay readable on the dark base.

type Paint = Record<string, unknown>;
type Layout = Record<string, unknown>;
type AnyLayer = {
  id: string;
  type: string;
  paint?: Paint;
  layout?: Layout;
  [key: string]: unknown;
};

const DARK = {
  text: 'rgba(214, 212, 203, 1)',
  halo: 'rgba(10, 12, 9, 0.9)',
};

const PAINT_OVERRIDES: Record<string, Paint> = {
  background: { 'background-color': '#1b1d17' },

  // Vegetation – lifted so forests/greens read clearly on the dark base
  landcover_wood: { 'fill-color': '#324a2c', 'fill-opacity': 1 },
  landcover_grass: { 'fill-color': '#36482c', 'fill-opacity': 0.6 },
  globallandcover_grass: { 'fill-color': '#33482a' },
  globallandcover_scrub: { 'fill-color': '#3a4a2d' },
  globallandcover_tree: { 'fill-color': '#324a2c' },
  globallandcover_forest: { 'fill-color': '#324a2c' },
  landcover_ice: { 'fill-color': '#4a515b' },
  globallandcover_ice: { 'fill-color': '#4a515b' },

  // Urban areas / industry / buildings – more present
  landuse_residential: {
    'fill-color': '#3c3525',
    'fill-opacity': {
      stops: [
        [7, 0.95],
        [12, 0.9],
        [16, 0.75],
      ],
    },
  },
  landuse_industrial: { 'fill-color': '#34322c', 'fill-opacity': 0.9 },
  building: { 'fill-color': '#473f2d' },
  'building-top': {
    'fill-color': '#473f2d',
    'fill-outline-color': '#5e553f',
  },
  'building-3d': { 'fill-extrusion-color': '#3e3829' },

  // Water – clearly readable blue
  water: { 'fill-color': '#234b78' },
  water_intermittent: { 'fill-color': '#234b78' },
  waterway_river: { 'line-color': '#356394' },
  waterway_other: { 'line-color': '#356394' },

  // Relief – stronger so terrain is clearly felt
  hillshade: {
    'hillshade-accent-color': 'rgba(0, 0, 0, 0.4)',
    'hillshade-exaggeration': {
      stops: [
        [5, 0.4],
        [9, 0.6],
        [13, 0.8],
        [16, 0.85],
      ],
    },
    'hillshade-shadow-color': 'rgba(0, 0, 0, 0.72)',
    'hillshade-highlight-color': 'rgba(175, 185, 168, 0.28)',
  },

  // Contours – more visible warm brown
  contour_index: { 'line-color': 'rgba(150, 122, 78, 0.85)' },
  contour: { 'line-color': 'rgba(150, 122, 78, 0.6)' },
  contour_label: { 'text-color': 'rgba(186, 164, 120, 0.95)' },

  // Footpaths – lighter so they stand out on the dark base
  road_path: { 'line-color': '#b6aa8a' },

  // KČT trail markings – brightened for night readability
  trail_red: { 'line-color': '#e8453d' },
  trail_red_extra: { 'line-color': '#e8453d' },
  trail_yellow: { 'line-color': '#ecd23a' },
  trail_yellow_extra: { 'line-color': '#ecd23a' },
  trail_green: { 'line-color': '#46b531' },
  trail_green_extra: { 'line-color': '#46b531' },
  trail_blue: { 'line-color': '#4f6cea' },

  // Roads dimmed so they no longer dominate the map
  road_minor: { 'line-color': '#8e8c82' },
  road_major: { 'line-color': '#bcb25a' },
  road_primary: { 'line-color': '#cf9a52' },
  road_motorway: { 'line-color': '#6e9d58' },
  road_minor_casing: { 'line-color': '#0e0f0b' },
  road_major_casing: { 'line-color': '#0e0f0b' },
  road_primary_casing: { 'line-color': '#0e0f0b' },
  road_motorway_casing: { 'line-color': '#0e0f0b' },
};

// Layers whose label colors we keep (handled explicitly above) instead of the
// generic light-on-dark treatment.
const KEEP_LABEL_COLOR = new Set(['contour_label']);

const applyDark = (style: StyleSpecification): StyleSpecification => {
  const dark = cloneDeep(style);

  for (const layer of dark.layers as unknown as AnyLayer[]) {
    // Generic: make all text labels light with a dark halo for night reading.
    if (layer.type === 'symbol' && !KEEP_LABEL_COLOR.has(layer.id)) {
      const paint = ((layer as { paint?: Paint }).paint ??= {});
      paint['text-color'] = DARK.text;
      paint['text-halo-color'] = DARK.halo;
    }

    const override = PAINT_OVERRIDES[layer.id];
    if (override) {
      layer.paint = { ...(layer.paint ?? {}), ...override };
    }
  }

  return dark;
};

export const touristDarkStyle = {
  ...applyDark(touristStyle),
  id: 'touristDark',
  name: 'Tourist dark',
} as StyleSpecification;

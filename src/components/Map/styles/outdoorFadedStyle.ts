import cloneDeep from 'lodash/cloneDeep';
import { StyleSpecification } from 'maplibre-gl';
import { outdoorStyle } from './outdoorStyle';

// "Outdoor faded" reuses the exact same output of `outdoorStyle`, but runs every
// color through a muting function so the basemap recedes into the background
// (useful as a backdrop for climbing/trail overlays).

// How strongly to mute: blend each color towards its own gray (desaturate) and
// then a touch towards white (lighten). 0 = keep original, 1 = full effect.
const DESATURATE = 0.7;
const LIGHTEN = 0.4;

type Rgba = { r: number; g: number; b: number; a: number };

const clampChannel = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const hueToRgb = (p: number, q: number, t: number) => {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
};

const hslToRgb = (h: number, s: number, l: number) => {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  return {
    r: hueToRgb(p, q, hk + 1 / 3) * 255,
    g: hueToRgb(p, q, hk) * 255,
    b: hueToRgb(p, q, hk - 1 / 3) * 255,
  };
};

// Parses the color notations actually used in outdoorStyle: rgb(a), hsl(a) and
// #hex. Returns null for anything else (e.g. named colors used in filters), so
// those are left untouched.
const parseColor = (input: string): Rgba | null => {
  const str = input.trim();

  const hex = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full =
      h.length === 3
        ? h
            .split('')
            .map((c) => c + c)
            .join('')
        : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgb = str.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i,
  );
  if (rgb) {
    return {
      r: parseFloat(rgb[1]),
      g: parseFloat(rgb[2]),
      b: parseFloat(rgb[3]),
      a: rgb[4] !== undefined ? parseFloat(rgb[4]) : 1,
    };
  }

  const hsl = str.match(
    /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i,
  );
  if (hsl) {
    const { r, g, b } = hslToRgb(
      parseFloat(hsl[1]),
      parseFloat(hsl[2]) / 100,
      parseFloat(hsl[3]) / 100,
    );
    return { r, g, b, a: hsl[4] !== undefined ? parseFloat(hsl[4]) : 1 };
  }

  return null;
};

const fadeColorString = (input: string): string => {
  const c = parseColor(input);
  if (!c) {
    return input;
  }
  const gray = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  const mute = (channel: number) => {
    const desaturated = channel * (1 - DESATURATE) + gray * DESATURATE;
    return desaturated * (1 - LIGHTEN) + 255 * LIGHTEN;
  };
  const r = clampChannel(mute(c.r));
  const g = clampChannel(mute(c.g));
  const b = clampChannel(mute(c.b));
  return `rgba(${r}, ${g}, ${b}, ${c.a})`;
};

// A maplibre color paint property can be a plain string, a legacy
// `{ stops: [[zoom, color], ...] }` function, or an expression array. Walk the
// whole value and fade any color string we meet; everything else passes through
// (expression operators, zoom stops, opacities, …) because it won't parse as a
// color.
const fadeColorValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return fadeColorString(value);
  }
  if (Array.isArray(value)) {
    return value.map(fadeColorValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, fadeColorValue(v)]),
    );
  }
  return value;
};

// Keep the color-coded hiking trails vivid from zoom 12+ (lesser zooms are "longdistance")
const HIKE_ROUTES = /^trail_(?!longdistance)/;

// Keep the road network (motorways, major & minor roads incl. their tunnels)
// at full color so it stays usable for navigating to the crags.
const ROADS =
  /^(road_(minor|major|motorway)|tunnel_(road_(minor|major)|motorway))$/;

const fadeStyleColors = (style: StyleSpecification): StyleSpecification => {
  const faded = cloneDeep(style);
  for (const layer of faded.layers) {
    const paint = (layer as { paint?: Record<string, unknown> }).paint;
    if (!paint) {
      continue;
    }
    if (HIKE_ROUTES.test(layer.id) || ROADS.test(layer.id)) {
      continue;
    }
    // Symbol layers with an `icon-color` but no explicit `text-color` render default black
    if (paint['icon-color'] && !paint['text-color']) {
      paint['text-color'] = 'rgba(0, 0, 0, 1)';
    }
    Object.keys(paint)
      .filter((key) => key.endsWith('color'))
      .forEach((key) => {
        paint[key] = fadeColorValue(paint[key]);
      });
  }
  return faded;
};

export const outdoorFadedStyle = {
  ...fadeStyleColors(outdoorStyle),
  id: 'outdoorFaded',
  name: 'Outdoor faded',
} as StyleSpecification;

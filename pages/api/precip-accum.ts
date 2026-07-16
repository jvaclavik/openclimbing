import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import * as hdf5 from 'jsfive';
import { precipColor } from '../../src/components/Map/Radar/precipScale';

// Renders an accumulated-precipitation map (24h / 48h) by summing the raw ČHMÚ
// MERGE 1h grids (ODIM HDF5, quantity ACRR, mm = gain*raw). Each MERGE file is
// a 1h sum published every 10 min, so we take one file per hour (non-overlapping
// windows) going back `hours` hours from the requested end time, sum them
// pixel-wise, colour them and return a PNG. The PNG is placed on the map using
// the MERGE data extent (see MERGE_DATA_COORDINATES).
const DIR =
  'https://opendata.chmi.cz/meteorology/weather/radar/composite/merge1h/hdf5/';

const W = 598;
const H = 378;
const NODATA = 32767;
const UNDETECT = 32766;
const GAIN = 0.1;

const ALLOWED_HOURS = new Set([24, 48]);
const TS_RE = /^\d{8}\.\d{4}$/;
const FETCH_CONCURRENCY = 8;

const single = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

// ---- caches (module-level, survive between requests in a warm lambda) -------
const GRID_CACHE = new Map<string, Uint16Array>();
const GRID_CACHE_MAX = 80; // ~80 * 452KB ≈ 35MB
const PNG_CACHE = new Map<string, Buffer>();
const PNG_CACHE_MAX = 8;

const putLru = <V>(cache: Map<string, V>, key: string, val: V, max: number) => {
  cache.set(key, val);
  while (cache.size > max) {
    cache.delete(cache.keys().next().value as string);
  }
};

const stampToStr = (d: Date) =>
  `${d.getUTCFullYear()}` +
  `${String(d.getUTCMonth() + 1).padStart(2, '0')}` +
  `${String(d.getUTCDate()).padStart(2, '0')}` +
  `${String(d.getUTCHours()).padStart(2, '0')}` +
  `${String(d.getUTCMinutes()).padStart(2, '0')}00`;

const endMsFromTs = (ts: string) => {
  const [d, hm] = ts.split('.');
  return Date.UTC(
    +d.slice(0, 4),
    +d.slice(4, 6) - 1,
    +d.slice(6, 8),
    +hm.slice(0, 2),
    +hm.slice(2, 4),
  );
};

const getGrid = async (stamp: string): Promise<Uint16Array | null> => {
  const cached = GRID_CACHE.get(stamp);
  if (cached) {
    return cached;
  }
  const res = await fetch(`${DIR}T_PASV23_C_OKPR_${stamp}.hdf`);
  if (!res.ok) {
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const file = new hdf5.File(buf.buffer, 'g.hdf');
  const dset = file.get('dataset1/data1/data') as { value: number[] } | null;
  if (!dset || dset.value.length !== W * H) {
    return null;
  }
  const arr = Uint16Array.from(dset.value);
  putLru(GRID_CACHE, stamp, arr, GRID_CACHE_MAX);
  return arr;
};

// Fetch/parse the grids with a small concurrency limit and sum them.
const buildAccum = async (stamps: string[]) => {
  const sum = new Float32Array(W * H);
  const valid = new Uint8Array(W * H);
  let ok = 0;

  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const i = cursor;
      cursor += 1;
      if (i >= stamps.length) {
        return;
      }
      const grid = await getGrid(stamps[i]);
      if (!grid) {
        continue;
      }
      ok += 1;
      for (let p = 0; p < grid.length; p++) {
        const raw = grid[p];
        if (raw === NODATA) {
          continue;
        }
        valid[p] = 1;
        if (raw !== UNDETECT) {
          sum[p] += raw * GAIN;
        }
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, stamps.length) }, worker),
  );

  return { sum, valid, ok };
};

const renderPng = (sum: Float32Array, valid: Uint8Array): Buffer => {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  for (let p = 0; p < W * H; p++) {
    const [r, g, b, a] = valid[p] ? precipColor(sum[p]) : [0, 0, 0, 0];
    const o = p * 4;
    img.data[o] = r;
    img.data[o + 1] = g;
    img.data[o + 2] = b;
    img.data[o + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer('image/png');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }

  const hours = Number(single(req.query.hours) ?? 24);
  if (!ALLOWED_HOURS.has(hours)) {
    res.status(400).end('Invalid hours (24 or 48)');
    return;
  }

  const ts = single(req.query.ts);
  if (typeof ts !== 'string' || !TS_RE.test(ts)) {
    res.status(400).end('Invalid ts (expected YYYYMMDD.HHMM)');
    return;
  }

  const endMs = endMsFromTs(ts);
  const endStamp = stampToStr(new Date(endMs));
  const cacheKey = `${hours}:${endStamp}`;

  const cached = PNG_CACHE.get(cacheKey);
  if (cached) {
    res
      .status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Cache-Control', 'public, max-age=600, immutable')
      .send(cached);
    return;
  }

  const stamps = Array.from({ length: hours }, (_, i) =>
    stampToStr(new Date(endMs - i * 3600_000)),
  );

  try {
    const { sum, valid, ok } = await buildAccum(stamps);
    if (ok === 0) {
      res.status(502).end('No grids available');
      return;
    }
    const png = renderPng(sum, valid);
    putLru(PNG_CACHE, cacheKey, png, PNG_CACHE_MAX);
    res
      .status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Cache-Control', 'public, max-age=600, immutable')
      .send(png);
  } catch (err) {
    res.status(502).end(String(err));
  }
}

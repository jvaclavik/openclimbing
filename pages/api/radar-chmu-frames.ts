import type { NextApiRequest, NextApiResponse } from 'next';

// Lists the most recent ČHMÚ composite frames by parsing the opendata directory
// index. Returns them oldest→newest so the UI can drive a time slider.
// Supports the instantaneous radar (MAX_Z) and the MERGE 1h precipitation sums.
const PRODUCTS = {
  maxz: {
    dir: 'https://opendata.chmi.cz/meteorology/weather/radar/composite/maxz/png_masked/',
    re: /pacz2gmaps3\.z_max3d\.(\d{8})\.(\d{4})\.0\.png/g,
  },
  merge1h: {
    dir: 'https://opendata.chmi.cz/meteorology/weather/radar/composite/merge1h/png/',
    re: /pacz2gmaps3\.merge\.(\d{8})\.(\d{4})\.60\.png/g,
  },
} as const;

type ProductKey = keyof typeof PRODUCTS;

// ~2h of radar (5-min step) / ~4h of MERGE (10-min step).
const MAX_FRAMES = 24;

export type RadarFrame = {
  ts: string; // `YYYYMMDD.HHMM` (UTC) – key for /api/radar-chmu
  time: string; // ISO timestamp (UTC)
};

const single = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const tsToIso = (ts: string): string => {
  const [d, hm] = ts.split('.');
  const y = Number(d.slice(0, 4));
  const mo = Number(d.slice(4, 6)) - 1;
  const day = Number(d.slice(6, 8));
  const h = Number(hm.slice(0, 2));
  const mi = Number(hm.slice(2, 4));
  return new Date(Date.UTC(y, mo, day, h, mi)).toISOString();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ frames: RadarFrame[]; error?: string }>,
) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }

  const productKey = (single(req.query.product) ?? 'maxz') as ProductKey;
  const product = PRODUCTS[productKey];
  if (!product) {
    res.status(400).json({ frames: [], error: 'Invalid product' });
    return;
  }

  try {
    const upstream = await fetch(product.dir);
    if (!upstream.ok) {
      throw new Error(`directory listing ${upstream.status}`);
    }
    const html = await upstream.text();

    const seen = new Set<string>();
    const re = new RegExp(product.re.source, 'g');
    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = re.exec(html))) {
      seen.add(`${match[1]}.${match[2]}`);
    }

    const frames = [...seen]
      .sort()
      .slice(-MAX_FRAMES)
      .map((ts) => ({ ts, time: tsToIso(ts) }));

    res
      .status(200)
      .setHeader('Cache-Control', 'public, max-age=60')
      .json({ frames });
  } catch (err) {
    res.status(502).json({ frames: [], error: String(err) });
  }
}

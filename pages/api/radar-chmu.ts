import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy for a single ČHMÚ composite frame (radar MAX_Z masked PNG, or MERGE 1h
// precipitation PNG). The opendata.chmi.cz server sends no CORS headers, so the
// browser can't load the PNG straight into a WebGL texture – we stream it
// same-origin instead. Files are timestamped and immutable → cache hard.
const PRODUCTS = {
  maxz: {
    base: 'https://opendata.chmi.cz/meteorology/weather/radar/composite/maxz/png_masked/',
    file: (ts: string) => `pacz2gmaps3.z_max3d.${ts}.0.png`,
  },
  merge1h: {
    base: 'https://opendata.chmi.cz/meteorology/weather/radar/composite/merge1h/png/',
    file: (ts: string) => `pacz2gmaps3.merge.${ts}.60.png`,
  },
} as const;

type ProductKey = keyof typeof PRODUCTS;

// ts = `YYYYMMDD.HHMM` (UTC). Strict to avoid SSRF via the upstream URL.
const TS_RE = /^\d{8}\.\d{4}$/;

const single = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }

  const ts = single(req.query.ts);
  if (typeof ts !== 'string' || !TS_RE.test(ts)) {
    res.status(400).end('Invalid ts (expected YYYYMMDD.HHMM)');
    return;
  }

  const productKey = (single(req.query.product) ?? 'maxz') as ProductKey;
  const product = PRODUCTS[productKey];
  if (!product) {
    res.status(400).end('Invalid product');
    return;
  }

  try {
    const upstream = await fetch(`${product.base}${product.file(ts)}`);
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res
      .status(200)
      .setHeader('Content-Type', 'image/png')
      .setHeader('Cache-Control', 'public, max-age=86400, immutable')
      .send(buf);
  } catch (err) {
    res.status(502).end(String(err));
  }
}

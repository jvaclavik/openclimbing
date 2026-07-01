import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy for a single ČHMÚ radar composite frame (MAX_Z, masked PNG).
// The opendata.chmi.cz server sends no CORS headers, so the browser can't load
// the PNG straight into a WebGL texture – we stream it same-origin instead.
// Files are timestamped and immutable, so they can be cached hard.
const BASE =
  'https://opendata.chmi.cz/meteorology/weather/radar/composite/maxz/png_masked/';

// ts = `YYYYMMDD.HHMM` (UTC). Strict to avoid SSRF via the upstream URL.
const TS_RE = /^\d{8}\.\d{4}$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }

  const raw = req.query.ts;
  const ts = Array.isArray(raw) ? raw[0] : raw;
  if (typeof ts !== 'string' || !TS_RE.test(ts)) {
    res.status(400).end('Invalid ts (expected YYYYMMDD.HHMM)');
    return;
  }

  try {
    const upstream = await fetch(`${BASE}pacz2gmaps3.z_max3d.${ts}.0.png`);
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

import type { NextApiRequest, NextApiResponse } from 'next';
import { PROJECT_URL } from '../../src/services/project';

// Same-origin proxy for third party raster tiles which are served without CORS
// headers – the browser refuses to load them into a WebGL texture. Usage:
// `/api/cors-proxy?url=https%3A%2F%2Fexample.com%2F1%2F2%2F3.jpg`
//
// Not an open proxy: only hosts listed below can be requested, otherwise this
// endpoint would happily fetch anything reachable from our servers (SSRF).
const ALLOWED_HOSTS = [
  'cz-hires-shading.tiles.freemap.sk', // ČÚZK DMR 5G hires render (see osmappLayers)
];

const TIMEOUT_MS = 20_000;

// Upstream headers worth passing through to the browser. `content-length` is
// deliberately not among them – fetch() transparently decompresses the body, so
// the upstream value may not match what we send.
const FORWARDED_HEADERS = ['content-type', 'etag'];

const single = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const parseUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const isAllowed =
      parsed.protocol === 'https:' && ALLOWED_HOSTS.includes(parsed.hostname);
    return isAllowed ? parsed : null;
  } catch {
    return null;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).setHeader('Allow', 'GET, HEAD').end();
    return;
  }

  const url = single(req.query.url);
  if (!url) {
    res.status(400).end('Missing `url` query parameter');
    return;
  }

  const parsed = parseUrl(url);
  if (!parsed) {
    res.status(403).end('URL not allowed');
    return;
  }

  try {
    const upstream = await fetch(parsed, {
      headers: {
        Accept: req.headers.accept ?? '*/*',
        'User-Agent': `OpenClimbing ${process.env.osmappVersion} (+${PROJECT_URL}; cors-proxy.ts)`,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    FORWARDED_HEADERS.forEach((header) => {
      const value = upstream.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Cache-Control',
      upstream.ok
        ? 'public, max-age=604800, stale-while-revalidate=86400'
        : 'no-store',
    );

    if (req.method === 'HEAD') {
      res.status(upstream.status).end();
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch (err) {
    res.status(502).end(String(err));
  }
}

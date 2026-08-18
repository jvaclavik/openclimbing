import type { NextApiRequest, NextApiResponse } from 'next';
import { PROJECT_URL } from '../../src/services/project';

const ALLOWED_HOSTS = ['cz-hires-shading.tiles.freemap.sk'];

const TIMEOUT_MS = 20_000;

const FORWARDED_HEADERS = ['content-type', 'etag'];

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

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

    const isImage = !!upstream.headers
      .get('content-type')
      ?.startsWith('image/');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Cache-Control',
      upstream.ok && isImage ? IMMUTABLE_CACHE : 'no-store',
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

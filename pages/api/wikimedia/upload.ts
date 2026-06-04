import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'node:stream';

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

// Disable Next's body parser so we can pipe the raw multipart stream straight
// through to Wikimedia without buffering the whole file in memory first.
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

/**
 * Server-side proxy for Wikimedia Commons file uploads. The browser cannot call
 * the Commons API directly because openclimbing.org is not in Wikimedia's CORS
 * allowlist. We stream the raw multipart body straight through; the Bearer
 * token from the client carries the user's OAuth identity. The server itself
 * is stateless and does not store the file.
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const authHeader = req.headers.authorization;
  const contentType = req.headers['content-type'];
  const contentLength = req.headers['content-length'];
  if (!authHeader) {
    return res.status(401).json({ error: 'missing_authorization' });
  }
  if (!contentType?.startsWith('multipart/form-data')) {
    return res.status(400).json({ error: 'expected_multipart_form_data' });
  }

  try {
    const upstream = await fetch(COMMONS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': contentType,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        'User-Agent': `OpenClimbing ${process.env.osmappVersion ?? ''} (openclimbing.org)`,
        Accept: 'application/json',
      },
      body: Readable.toWeb(req) as unknown as BodyInit,
      // Required by the WHATWG fetch spec when streaming a body. Not yet in TS
      // RequestInit types but supported by Node 18+ undici.
      // @ts-expect-error duplex not in lib.dom types
      duplex: 'half',
    });

    const upstreamContentType = upstream.headers.get('content-type');
    res.status(upstream.status);
    if (upstreamContentType) res.setHeader('Content-Type', upstreamContentType);
    const text = await upstream.text();
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: 'upstream_error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

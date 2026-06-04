import type { NextApiRequest, NextApiResponse } from 'next';

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

// Disable Next's default body parser so we can stream the raw multipart body
// straight through to Wikimedia without re-buffering.
export const config = {
  api: {
    bodyParser: false,
    // Vercel serverless functions have a hard request size limit (~4.5 MB on Hobby);
    // see WIKIPEDIA_LIMIT in the client. Larger uploads need a different transport.
    responseLimit: false,
  },
};

const readRawBody = (req: NextApiRequest): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (chunk) =>
      chunks.push(
        chunk instanceof Uint8Array
          ? chunk
          : new Uint8Array(Buffer.from(chunk)),
      ),
    );
    req.on('end', () => {
      const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      resolve(merged);
    });
    req.on('error', reject);
  });

/**
 * Server-side proxy for Wikimedia Commons file uploads. Streams the raw
 * multipart/form-data body straight through; the Bearer token from the client
 * carries the user's OAuth identity to Wikimedia.
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const authHeader = req.headers.authorization;
  const contentType = req.headers['content-type'];
  if (!authHeader) {
    return res.status(401).json({ error: 'missing_authorization' });
  }
  if (!contentType?.startsWith('multipart/form-data')) {
    return res.status(400).json({ error: 'expected_multipart_form_data' });
  }

  try {
    const body = await readRawBody(req);
    const upstream = await fetch(COMMONS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': contentType,
        'User-Agent': `OpenClimbing ${process.env.osmappVersion ?? ''} (openclimbing.org)`,
        Accept: 'application/json',
      },
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    const upstreamContentType = upstream.headers.get('content-type');
    if (upstreamContentType) res.setHeader('Content-Type', upstreamContentType);
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: 'upstream_error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

import type { NextApiRequest, NextApiResponse } from 'next';

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

/**
 * Server-side proxy for Wikimedia Commons Action API.
 *
 * Wikimedia restricts CORS to wiki / toolforge domains via $wgCrossSiteAJAXdomains,
 * so browsers on openclimbing.org cannot call commons.wikimedia.org directly. This
 * proxy forwards the request from the server, where CORS does not apply.
 *
 * The OAuth 2.0 Bearer token is passed through from the client — the server is
 * stateless and does not see or store the user's session.
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const authHeader = req.headers.authorization;
  const url = `${COMMONS_API_URL}?${new URLSearchParams(
    req.query as Record<string, string>,
  )}`;

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        'User-Agent': `OpenClimbing ${process.env.osmappVersion ?? ''} (openclimbing.org)`,
        Accept: 'application/json',
      },
    });

    const body = await upstream.text();
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err) {
    res.status(502).json({
      error: 'upstream_error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

import type { NextApiResponse } from 'next';

export const addCorsAndCache = (res: NextApiResponse) => {
  const maxAge = 'max-age=60, s-maxage=60'; // update also in `climbing_tiles.stats` message

  res.setHeader('Access-Control-Allow-Origin', '*'); // wildcard is needed to enable the vercel cache, it ignores the `origin` and caches randomnly one TODO consider Vary header if need be
  res.setHeader('Cache-Control', `public, ${maxAge}`);
};

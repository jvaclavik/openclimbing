import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchOsmPublicUserAvatarUrl } from '../../../src/services/osm/fetchOsmPublicUserAvatarUrl';

type ResponseBody = { imageUrl: string | null };

const MAX_LEN = 256;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const raw = req.query.displayName;
  const displayName = Array.isArray(raw) ? raw[0] : raw;

  if (typeof displayName !== 'string' || displayName.length > MAX_LEN) {
    res.status(400).json({ imageUrl: null });
    return;
  }

  if (/[\n\r\0]/.test(displayName)) {
    res.status(400).json({ imageUrl: null });
    return;
  }

  try {
    const imageUrl = await fetchOsmPublicUserAvatarUrl(displayName);
    res.status(200).json({ imageUrl });
  } catch {
    res.status(200).json({ imageUrl: null });
  }
}

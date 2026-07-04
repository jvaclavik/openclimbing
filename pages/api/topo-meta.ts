import type { NextApiRequest, NextApiResponse } from 'next';
import { getApiId, getShortId } from '../../src/services/helpers';
import { fetchWithMemberFeatures } from '../../src/services/osm/fetchWithMemberFeatures';
import { isTag } from '../../src/services/types';

export type TopoMetaPhoto = {
  photoIndex: number;
  imageUrl: string | null;
  tagKey: string | null;
  /** ShortIds of members that have a path drawn on this photo. */
  memberShortIds: string[];
  /** True if the feature itself has its own path on this photo. */
  parentHasPath: boolean;
};

export type TopoMetaResponse = {
  parentShortId: string;
  photos: TopoMetaPhoto[];
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }

  const idRaw = req.query.id;
  if (typeof idRaw !== 'string' || !idRaw.trim()) {
    res.status(400).json({ error: 'missing_id' });
    return;
  }

  try {
    const osmId = getApiId(idRaw);
    const nocache = req.query.fresh === '1' || req.query.fresh === 'true';
    const feature = await fetchWithMemberFeatures(osmId, { nocache });
    const photos: TopoMetaPhoto[] = (feature.imageDefs ?? []).map(
      (def, idx) => {
        if (!isTag(def)) {
          return {
            photoIndex: idx,
            imageUrl: null,
            tagKey: null,
            memberShortIds: [],
            parentHasPath: false,
          };
        }
        return {
          photoIndex: idx,
          imageUrl: def.v ?? null,
          tagKey: def.k ?? null,
          memberShortIds:
            def.memberPaths?.map((mp) => getShortId(mp.member.osmMeta)) ?? [],
          parentHasPath: !!def.path,
        };
      },
    );

    const body: TopoMetaResponse = {
      parentShortId: getShortId(feature.osmMeta),
      photos,
    };
    res
      .status(200)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Cache-Control', nocache ? 'no-store' : 'public, max-age=300')
      .send(body);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};

import { getDb } from '../db/db';

// child `${osmType}/${osmId}` -> relation osmIds that list it as a member.
// Built once per open database; area/crag relations are a few thousand rows.
const parentIndexCache = new WeakMap<object, Map<string, number[]>>();

const getParentIndex = (): Map<string, number[]> => {
  const db = getDb();
  const cached = parentIndexCache.get(db);
  if (cached) return cached;

  const index = new Map<string, number[]>();
  const rows = db
    .prepare<[], { osmId: number; members: string }>(
      `SELECT "osmId", members FROM climbing_features
       WHERE "osmType" = 'relation' AND type IN ('area', 'crag') AND members IS NOT NULL`,
    )
    .all();

  for (const row of rows) {
    let members: { type?: string; ref?: number }[];
    try {
      members = JSON.parse(row.members);
    } catch {
      continue;
    }
    if (!Array.isArray(members)) continue;

    for (const member of members) {
      if (!member?.type || typeof member.ref !== 'number') continue;
      const key = `${member.type}/${member.ref}`;
      const list = index.get(key);
      if (list) {
        if (!list.includes(row.osmId)) list.push(row.osmId);
      } else {
        index.set(key, [row.osmId]);
      }
    }
  }

  parentIndexCache.set(db, index);
  return index;
};

// `parentId` stays first (the stored primary parent). Other area/crag relations
// that list this feature as a member follow, so a second branch is not dropped.
export const getDirectParentRelationIds = (
  osmType: string,
  osmId: number,
  parentId?: number | null,
): number[] => {
  const fromMembers = getParentIndex().get(`${osmType}/${osmId}`) ?? [];
  const extras = fromMembers
    .filter((id) => id !== parentId)
    .sort((a, b) => a - b);

  if (parentId != null && Number.isFinite(parentId)) {
    return [parentId, ...extras];
  }
  return extras;
};

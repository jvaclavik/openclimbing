import { Database } from 'better-sqlite3';
import { parseClimbingLengthMeters } from '../../services/tagging/climbing/parseClimbingLength';

type LengthRow = {
  id: number;
  type: string;
  osmType: string;
  osmId: number;
  parentId: number | null;
  members: string | null;
  tags: string | null;
};

type MemberRef = { type: string; ref: number; role?: string };
type Length = { min: number; max: number };

const lengthFromTags = (tagsJson: string | null): Length | null => {
  if (!tagsJson) return null;
  try {
    const tags = JSON.parse(tagsJson) as Record<string, string>;
    const values = [
      parseClimbingLengthMeters(tags['climbing:length']),
      parseClimbingLengthMeters(tags['climbing:length:min']),
      parseClimbingLengthMeters(tags['climbing:length:max']),
    ].filter(Boolean);
    if (values.length === 0) return null;
    return {
      min: Math.min(...values.map((v) => v!.min)),
      max: Math.max(...values.map((v) => v!.max)),
    };
  } catch {
    return null;
  }
};

const mergeLength = (a: Length | null, b: Length | null): Length | null => {
  if (!a) return b;
  if (!b) return a;
  return { min: Math.min(a.min, b.min), max: Math.max(a.max, b.max) };
};

/**
 * Populate lengthMin/lengthMax from OSM tags, then roll up to parents via:
 * 1) relation `members` (when present)
 * 2) child `parentId` (when members are missing – common for node crags)
 */
export const backfillClimbingLengthAggregates = (db: Database) => {
  const rows = db
    .prepare<[], LengthRow>(
      `SELECT id, type, "osmType", "osmId", "parentId", members, tags
       FROM climbing_features`,
    )
    .all();

  const update = db.prepare(
    `UPDATE climbing_features SET "lengthMin" = ?, "lengthMax" = ? WHERE id = ?`,
  );

  const byKey = new Map<string, LengthRow>();
  const byOsmId = new Map<number, LengthRow[]>();
  const lengths = new Map<number, Length>();

  for (const row of rows) {
    byKey.set(`${row.osmType}/${row.osmId}`, row);
    const list = byOsmId.get(row.osmId) ?? [];
    list.push(row);
    byOsmId.set(row.osmId, list);

    const fromTags = lengthFromTags(row.tags);
    if (fromTags) {
      lengths.set(row.id, fromTags);
    }
  }

  const addTo = (id: number, length: Length) => {
    lengths.set(id, mergeLength(lengths.get(id) ?? null, length)!);
  };

  // Roll up via members JSON (relation crags/areas)
  const visiting = new Set<number>();
  const fromMembers = (row: LengthRow): Length | null => {
    if (visiting.has(row.id)) return lengths.get(row.id) ?? null;
    visiting.add(row.id);
    let agg = lengths.get(row.id) ?? null;
    if (row.members) {
      try {
        const members = JSON.parse(row.members) as MemberRef[];
        for (const member of members) {
          const child = byKey.get(`${member.type}/${member.ref}`);
          if (!child) continue;
          if (
            child.type === 'route' ||
            child.type === 'route_top' ||
            child.type === 'crag' ||
            child.type === 'area'
          ) {
            agg = mergeLength(agg, fromMembers(child));
          }
        }
      } catch {
        // ignore
      }
    }
    visiting.delete(row.id);
    if (agg) lengths.set(row.id, agg);
    return agg;
  };

  for (const row of rows) {
    if (row.type === 'crag' || row.type === 'area') {
      fromMembers(row);
    }
  }

  // Roll up via parentId (fills gaps when members are absent)
  for (let pass = 0; pass < 3; pass += 1) {
    for (const row of rows) {
      const length = lengths.get(row.id);
      if (!length || row.parentId == null) continue;
      for (const parent of byOsmId.get(row.parentId) ?? []) {
        if (parent.type === 'crag' || parent.type === 'area') {
          addTo(parent.id, length);
        }
      }
    }
  }

  for (const [id, length] of lengths) {
    update.run(length.min, length.max, id);
  }
};

import {
  getApiId,
  getShortId,
  isValidOsmShortId,
  normalizeOsmShortIdKey,
} from '../helpers';
import { fetchOverpass } from '../overpass/fetchOverpass';
import type {
  OverpassFeature,
  OverpassResponse,
} from '../overpass/overpassSearch';
import type { FeatureTags } from '../types';
import type { ClimbingTick } from '../../types';

type RelationElement = {
  type: 'relation';
  id: number;
  tags?: Record<string, string>;
  members?: { type: string; ref: number; role?: string }[];
};

const CHUNK = 16;

const hasDisplayName = (
  tags: FeatureTags | Record<string, string> | undefined,
) => !!(tags?.name?.trim() || tags?.['name:en']?.trim());

const hasClimbingGradeTag = (
  tags: FeatureTags | Record<string, string> | undefined,
) => tags && Object.keys(tags).some((k) => k.startsWith('climbing:grade'));

const needsEnrichment = (tags: FeatureTags | Record<string, string>) =>
  !hasDisplayName(tags) || !hasClimbingGradeTag(tags);

const isCragAreaRelation = (tags: FeatureTags | Record<string, string>) => {
  const c = tags?.climbing;
  return c === 'crag' || c === 'area' || c === 'boulder';
};

const relationScore = (tags: FeatureTags): number => {
  if (!tags || isCragAreaRelation(tags)) {
    return -1;
  }
  let s = 0;
  if (tags.route === 'climbing') {
    s += 25;
  }
  if (tags.type === 'route') {
    s += 10;
  }
  if (hasDisplayName(tags)) {
    s += 8;
  }
  if (hasClimbingGradeTag(tags)) {
    s += 8;
  }
  return s;
};

const mergeNameAndGradeFromRelation = (
  base: FeatureTags,
  rel: FeatureTags,
): FeatureTags => {
  const out: FeatureTags = { ...base };
  if (rel.name?.trim()) {
    out.name = rel.name;
  }
  if (rel['name:en']?.trim()) {
    out['name:en'] = rel['name:en'];
  }
  for (const key of Object.keys(rel)) {
    if (key.startsWith('climbing:grade')) {
      out[key] = rel[key];
    }
  }
  return out;
};

const memberMatches = (
  m: { type?: string; ref?: number | string },
  refType: 'node' | 'way',
  refId: number,
) => String(m.type ?? '').toLowerCase() === refType && Number(m.ref) === refId;

const pickBestRelationTags = (
  relationsById: Map<number, RelationElement>,
  refType: 'node' | 'way',
  refId: number,
): FeatureTags | null => {
  const candidates: FeatureTags[] = [];
  for (const rel of relationsById.values()) {
    const members = rel.members ?? [];
    if (!members.some((m) => memberMatches(m, refType, refId))) {
      continue;
    }
    const tags = rel.tags ?? {};
    if (relationScore(tags) < 0) {
      continue;
    }
    candidates.push(tags);
  }
  if (candidates.length === 0) {
    for (const rel of relationsById.values()) {
      const members = rel.members ?? [];
      if (!members.some((m) => memberMatches(m, refType, refId))) {
        continue;
      }
      const tags = rel.tags ?? {};
      if (!hasDisplayName(tags) || isCragAreaRelation(tags)) {
        continue;
      }
      return tags;
    }
    return null;
  }
  candidates.sort((a, b) => relationScore(b) - relationScore(a));
  return candidates[0];
};

export async function enrichTickFeaturesFromParentRelations(
  features: OverpassFeature[],
  ticks: ClimbingTick[],
): Promise<void> {
  const byShortId = new Map<string, OverpassFeature>();
  for (const f of features) {
    byShortId.set(normalizeOsmShortIdKey(getShortId(f.osmMeta)), f);
  }

  const nodeNeedy: number[] = [];
  const wayNeedy: number[] = [];

  for (const tick of ticks) {
    const sidRaw = tick.shortId;
    if (!sidRaw) {
      continue;
    }
    const sid = normalizeOsmShortIdKey(sidRaw);
    if (!isValidOsmShortId(sid)) {
      continue;
    }
    const feature = byShortId.get(sid);
    if (!feature || !needsEnrichment(feature.tags)) {
      continue;
    }
    const { type, id } = getApiId(sid);
    if (type === 'node') {
      nodeNeedy.push(id);
    } else if (type === 'way') {
      wayNeedy.push(id);
    }
  }

  const uniq = (xs: number[]) => [...new Set(xs)];
  const nodeIds = uniq(nodeNeedy);
  const wayIds = uniq(wayNeedy);

  if (nodeIds.length === 0 && wayIds.length === 0) {
    return;
  }

  const statements: string[] = [
    ...nodeIds.map((id) => `relation(bn:${id});`),
    ...wayIds.map((id) => `relation(bw:${id});`),
  ];

  const relationsById = new Map<number, RelationElement>();

  for (let i = 0; i < statements.length; i += CHUNK) {
    const chunk = statements.slice(i, i + CHUNK).join('');
    const query = `[out:json][timeout:25];(${chunk});out body qt;`;
    const res = (await fetchOverpass(query)) as OverpassResponse;
    for (const el of res.elements) {
      if (el.type === 'relation') {
        relationsById.set(el.id, el as RelationElement);
      }
    }
  }

  for (const tick of ticks) {
    const sidRaw = tick.shortId;
    if (!sidRaw) {
      continue;
    }
    const sid = normalizeOsmShortIdKey(sidRaw);
    if (!isValidOsmShortId(sid)) {
      continue;
    }
    const feature = byShortId.get(sid);
    if (!feature || !needsEnrichment(feature.tags)) {
      continue;
    }
    const { type, id } = getApiId(sid);
    const relTags =
      type === 'node'
        ? pickBestRelationTags(relationsById, 'node', id)
        : type === 'way'
          ? pickBestRelationTags(relationsById, 'way', id)
          : null;
    if (!relTags) {
      continue;
    }
    feature.tags = mergeNameAndGradeFromRelation(feature.tags, relTags);
  }
}

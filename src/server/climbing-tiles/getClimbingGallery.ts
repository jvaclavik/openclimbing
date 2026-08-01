import { getDb } from '../db/db';
import { FeatureTags, OsmType } from '../../services/types';
import { getCommonsImageRatios } from './getCommonsImageRatios';

// same as in overpassToGeojsons.ts – the server intentionally doesn't import
// from components/
const isWikimediaCommonsPhotoPath = (tag: string) =>
  /^wikimedia_commons(:\d+)*:path$/.test(tag);

export type ClimbingGalleryItem = {
  osmType: OsmType;
  osmId: number;
  name: string;
  countryCode: string | null;
  lon: number;
  lat: number;
  routeCount: number;
  routesWithPhoto: number;
  photo: string; // `File:…` on Wikimedia Commons
  routesOnPhoto: number; // how many routes are drawn on that particular photo
  photoRatio?: number; // width / height, so the gallery can size tiles upfront
};

type RelationRow = {
  type: string;
  osmId: number;
  parentId: number | null;
  name: string | null;
  routeCount: number | null;
  routesWithPhoto: number | null;
  lon: number;
  lat: number;
  countryCode: string | null;
};

type TaggedRow = {
  parentId: number | null;
  tags: string;
};

const CACHE_TTL = 15 * 60 * 1000;

// The gallery is derived from the whole DB at once (~3k relations, ~3k rows with
// a drawn line), which is cheap, but it would be wasteful to redo it for every
// homepage visit. Data only changes on the (nightly) climbing tiles refresh.
const store = global as unknown as {
  climbingGallery?: { builtAt: number; items: Promise<ClimbingGalleryItem[]> };
};

// Walks up the parentId chain to the enclosing area. Crags without any area
// parent (standalone rocks) represent themselves, so they are not lost.
const findGroup = (
  relationsById: Map<number, RelationRow>,
  parentId: number | null,
): RelationRow | null => {
  let current = parentId ? relationsById.get(parentId) : undefined;
  let firstCrag: RelationRow | null = null;
  const visited = new Set<number>();

  while (current && !visited.has(current.osmId)) {
    visited.add(current.osmId);
    if (current.type === 'area') {
      return current;
    }
    if (!firstCrag && current.type === 'crag') {
      firstCrag = current;
    }
    current = current.parentId
      ? relationsById.get(current.parentId)
      : undefined;
  }

  return firstCrag;
};

const countPhotosOfRoute = (tags: FeatureTags, photos: Map<string, number>) => {
  for (const [key, value] of Object.entries(tags)) {
    if (!isWikimediaCommonsPhotoPath(key) || !value?.trim()) {
      continue;
    }
    const file = tags[key.replace(/:path$/, '')];
    if (file?.startsWith('File:')) {
      photos.set(file, (photos.get(file) ?? 0) + 1);
    }
  }
};

// The "representative" photo of an area – the one with the most routes drawn on
// it. Ties are broken by name so the gallery doesn't reshuffle between builds.
const pickBestPhoto = (photos: Map<string, number>) =>
  [...photos.entries()].sort(
    ([fileA, countA], [fileB, countB]) =>
      countB - countA || fileA.localeCompare(fileB),
  )[0];

const buildGallery = (): ClimbingGalleryItem[] => {
  const db = getDb();

  const relations = db
    .prepare<[], RelationRow>(
      `SELECT type, "osmId", "parentId", COALESCE(name, "nameRaw") AS name,
        "routeCount", "routesWithPhoto", lon, lat, "countryCode"
       FROM climbing_features WHERE "osmType" = 'relation'`,
    )
    .all();
  const relationsById = new Map(relations.map((row) => [row.osmId, row]));

  const rowsWithPath = db
    .prepare<
      [],
      TaggedRow
    >(`SELECT "parentId", tags FROM climbing_features WHERE tags LIKE '%:path%'`)
    .all();

  const photosByGroup = new Map<number, Map<string, number>>();
  for (const row of rowsWithPath) {
    const group = findGroup(relationsById, row.parentId);
    if (!group) {
      continue;
    }
    const photos = photosByGroup.get(group.osmId) ?? new Map<string, number>();
    photosByGroup.set(group.osmId, photos);
    countPhotosOfRoute(JSON.parse(row.tags) as FeatureTags, photos);
  }

  const items: ClimbingGalleryItem[] = [];
  for (const [osmId, photos] of photosByGroup) {
    const group = relationsById.get(osmId);
    const best = pickBestPhoto(photos);
    if (!group?.name || !best) {
      continue;
    }
    const [photo, routesOnPhoto] = best;
    items.push({
      osmType: 'relation',
      osmId,
      name: group.name,
      countryCode: group.countryCode,
      lon: group.lon,
      lat: group.lat,
      routeCount: group.routeCount ?? 0,
      routesWithPhoto: group.routesWithPhoto ?? 0,
      photo,
      routesOnPhoto,
    });
  }

  return items.sort(
    (a, b) =>
      b.routesWithPhoto - a.routesWithPhoto ||
      b.routesOnPhoto - a.routesOnPhoto ||
      a.name.localeCompare(b.name),
  );
};

// Photos whose ratio Commons refuses to tell us (deleted or renamed file) are
// dropped – such a tile would render as an empty box anyway. When the Commons
// lookup itself fails, everything is kept and the gallery falls back to its
// default ratio.
const withPhotoRatios = async (items: ClimbingGalleryItem[]) => {
  let getRatio: (file: string) => number | null | undefined;
  try {
    getRatio = await getCommonsImageRatios(items.map((item) => item.photo));
  } catch (e) {
    console.warn('getCommonsImageRatios failed', e); // eslint-disable-line no-console
    return items;
  }

  return items
    .filter((item) => getRatio(item.photo) !== null)
    .map((item) => ({ ...item, photoRatio: getRatio(item.photo) }));
};

export const getClimbingGallery = (): Promise<ClimbingGalleryItem[]> => {
  const cached = store.climbingGallery;
  if (cached && Date.now() - cached.builtAt < CACHE_TTL) {
    return cached.items;
  }

  const items = withPhotoRatios(buildGallery());
  store.climbingGallery = { builtAt: Date.now(), items };
  return items;
};

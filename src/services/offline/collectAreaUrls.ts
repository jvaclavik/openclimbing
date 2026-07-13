import type { Geometry } from 'geojson';
import { ClimbingFeatureFull } from '../../types';
import { getBbox, NamedBbox } from '../getCenter';
import { getCommonsImageUrl } from '../images/getCommonsImageUrl';
import { CLIMBING_TILES_HOST } from '../osm/consts';
import { LonLat } from '../types';
import { OFFLINE_PHOTO_WIDTHS, OFFLINE_TILE_ZOOMS } from './consts';

// Web-Mercator lon/lat -> slippy tile x/y (same math as
// climbingTiles/computeTiles.ts getTile, inlined to avoid pulling maplibre-gl
// into this bundle).
const lngLatToTile = (z: number, lng: number, lat: number) => {
  const x = Math.floor((((lng + 180) % 360) / 360) * 2 ** z);
  const yRad = (lat * Math.PI) / 180;
  const yNorm =
    (1 - Math.log(Math.tan(yRad) + 1 / Math.cos(yRad)) / Math.PI) / 2;
  const yBounded = Math.min(Math.max(yNorm, 0), 1);
  const y = Math.floor(yBounded * 2 ** z) - (yBounded === 1 ? 1 : 0);
  return { x, y };
};

export type AreaUrls = {
  bbox: NamedBbox;
  featureUrls: string[];
  tileUrls: string[];
  photoUrls: string[];
  featureCount: number;
  photoCount: number;
};

// Recursively pull every [lng, lat] pair out of a GeoJSON geometry.
const geometryCoords = (geometry?: Geometry): LonLat[] => {
  if (!geometry) return [];
  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.flatMap(geometryCoords);
  }
  const flatten = (coords: unknown): LonLat[] => {
    if (!Array.isArray(coords)) return [];
    if (typeof coords[0] === 'number') return [coords as LonLat];
    return (coords as unknown[]).flatMap(flatten);
  };
  return flatten((geometry as { coordinates?: unknown }).coordinates);
};

// Wikimedia photo filenames from the tags of a single feature: wikimedia_commons,
// wikimedia_commons:2, ..., and image/image2/... when they hold a "File:" value.
const commonsFilesFromTags = (tags: Record<string, string>): string[] =>
  Object.entries(tags ?? {})
    .filter(
      ([key, value]) =>
        value?.startsWith('File:') &&
        (/^wikimedia_commons(:\d+)?$/.test(key) || /^image\d*$/.test(key)),
    )
    .map(([, value]) => value);

// Depth-first walk over the crag and its resolved children (memberFeatures tree).
const walk = (feature: ClimbingFeatureFull): ClimbingFeatureFull[] => [
  feature,
  ...(feature.memberFeatures ?? []).flatMap(walk),
];

export const getFeatureGetUrl = ({
  type,
  id,
}: {
  type: string;
  id: number;
}): string =>
  `${CLIMBING_TILES_HOST}api/climbing-tiles/get?osmType=${type}&osmId=${id}`;

const getTileUrl = (z: number, x: number, y: number): string =>
  `${CLIMBING_TILES_HOST}api/climbing-tiles/tile?z=${z}&x=${x}&y=${y}`;

/**
 * From a fully-resolved crag/area feature (the GET /api/climbing-tiles/get
 * response, which includes the whole child tree), compute every URL needed to
 * use that area offline:
 *  - the /get response for the crag and each descendant (so tapping a child
 *    route works offline),
 *  - the climbing tiles covering the area's bbox at zooms 6/9/12,
 *  - wikimedia topo photos referenced across all features.
 */
export const collectAreaUrls = (root: ClimbingFeatureFull): AreaUrls => {
  const features = walk(root);

  const coords: LonLat[] = features.flatMap((f) => [
    ...geometryCoords(f.geometry),
    ...(f.center ? [f.center as LonLat] : []),
  ]);
  const bbox = getBbox(coords.length ? coords : [root.center as LonLat]);

  const featureUrls = Array.from(
    new Set(features.map((f) => getFeatureGetUrl(f.osmMeta))),
  );

  const tileUrls: string[] = [];
  OFFLINE_TILE_ZOOMS.forEach((z) => {
    const nw = lngLatToTile(z, bbox.w, bbox.n);
    const se = lngLatToTile(z, bbox.e, bbox.s);
    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        tileUrls.push(getTileUrl(z, x, y));
      }
    }
  });

  const commonsFiles = Array.from(
    new Set(features.flatMap((f) => commonsFilesFromTags(f.tags))),
  );
  const photoUrls = commonsFiles.flatMap((file) =>
    OFFLINE_PHOTO_WIDTHS.map((w) => getCommonsImageUrl(file, w)).filter(
      (u): u is string => !!u,
    ),
  );

  return {
    bbox,
    featureUrls,
    tileUrls: Array.from(new Set(tileUrls)),
    photoUrls: Array.from(new Set(photoUrls)),
    featureCount: features.length,
    photoCount: commonsFiles.length,
  };
};

import { Feature as GeojsonFeature, Geometry } from 'geojson';
import { FeatureProperties, ImageDef, OsmType } from './services/types';

export type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

// below ONLY shared types among server + client

export type Tile = { z: number; x: number; y: number };

export type ClimbingStatsResponse = {
  lastRefresh: string;
  osmDataTimestamp: string;
  devStats: Record<string, string | number>;
  groupsCount: number;
  groupsWithNameCount: number;
  routesCount: number;
};

// @see climbingTilesSource#processFeature()
export type ClimbingTilesProperties = {
  type: 'area' | 'crag' | 'route' | 'route_top' | 'gym' | 'ferrata';
  name: string;
  label?: string; // computed on FE - processFeature()
  parentId?: number;

  // group only:
  routeCount?: number;
  hasImages?: boolean;
  histogramCode?: string;

  // route only:
  gradeId?: number;
  gradeTxt?: string;
  color?: string; // computed on FE - processFeature()

  // attribute filters (crag/area/route):
  materials?: string[];
  climbingTypes?: string[];
  inclinations?: string[];
  familyFriendly?: boolean;
};

// Relation ancestor of a search result (climbing area / site), nearest first.
export type ClimbingSearchParent = {
  name: string;
  osmType: OsmType;
  osmId: number;
};

export type ClimbingSearchRecord = {
  type: 'area' | 'crag' | 'gym' | 'ferrata' | 'route' | 'route_top';
  lon: number;
  lat: number;
  osmType: OsmType;
  osmId: number;
  name: string;
  countryCode?: string; // ISO 3166-1 lowercase, resolved from lon/lat during refresh
  parents?: ClimbingSearchParent[]; // relation ancestry (parentId chain), nearest first, up to 4
};

export type ClimbingTilesFeature = GeojsonFeature<
  Geometry,
  ClimbingTilesProperties
>;

// Full single feature returned by GET /api/climbing-tiles/get
// Shaped as a GeoJSON Feature, aligned with the osmapp `Feature` type
// (src/services/types.ts) for the fields computable from the tiles SQLite DB.
export type ClimbingFeatureFull = {
  type: 'Feature';
  id: number; // mapId
  osmMeta: { type: OsmType; id: number };
  tags: Record<string, string>;
  members?: { type: OsmType; ref: number; role: string }[]; // relations only
  memberFeatures?: ClimbingFeatureFull[]; // children resolved from DB (tree)
  parentFeatures?: ClimbingFeatureFull[]; // parent chain resolved from DB
  imageDefs?: ImageDef[]; // photos / topo image definitions from tags + center
  countryCode?: string; // ISO 3166-1 lowercase (root feature only)
  center: [number, number];
  geometry: Geometry;
  // Only class/subclass (POI icon), computed from tags like osmToFeature().
  // Tile-only props (routeCount, histogram, grade, ...) are computed on the FE.
  properties: FeatureProperties;
};

export type ClimbingTick = {
  id: number;
  osmUserId: number;
  shortId: string | null;
  timestamp: string;
  style: string | null;
  myGrade: string | null;
  note: string | null;
  pairing: Record<string, string> | null;
  /** From climbing_features when serving GET /api/climbing-ticks. */
  routeName?: string | null;
  routeGradeTxt?: string | null;
  routeLon?: number | null;
  routeLat?: number | null;
  /**
   * Skála/oblast (OSM `crag` / `area`): první takový předek v řetězci parentId nad cestou.
   * Jinak fallback na bezprostředního rodiče z DB.
   */
  routeCragName?: string | null;
  routeCragOsmType?: string | null;
  routeCragOsmId?: number | null;
  /** Druhý crag/area předek nad routeCrag (typicky vyšší úroveň — oblast). */
  routeAreaName?: string | null;
  routeAreaOsmType?: string | null;
  routeAreaOsmId?: number | null;
};

export type ClimbingTickDb = Omit<ClimbingTick, 'shortId'> & {
  osmType: string | null;
  osmId: number | null;
};

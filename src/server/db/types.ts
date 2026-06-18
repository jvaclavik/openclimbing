import { OsmType } from '../../services/types';

export type ClimbingFeaturesRow = {
  type: string;
  osmType: OsmType;
  osmId: number;
  lon: number;
  lat: number;
  name?: string;
  nameRaw: string;
  routeCount?: number;
  hasImages?: number; // sqlite doesn't have bool
  parentId?: number;
  gradeId?: number;
  gradeTxt?: string;
  line?: string; // JSON of type: number[][]
  histogramCode?: string;
  materials?: string | null; // comma-joined climbing:rock values
  climbingTypes?: string | null; // comma-joined climbing types
  inclinations?: string | null; // comma-joined inclinations
  familyFriendly?: number | null; // bool
};

export type ClimbingStatsRow = {
  id: number;
  timestamp: string;
  osm_data_timestamp: string;
  build_log: string;
  build_duration: number;
  max_size: number;
  max_size_zxy: string;
  max_time: number;
  max_time_zxy: string;
  groups_count: number;
  groups_with_name_count: number;
  routes_count: number;
};

// TODO add all tables here

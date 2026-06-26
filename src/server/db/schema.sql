-- SQLite schema v6 (see db.ts migrations when bumping user_version)

CREATE TABLE climbing_features
(
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT    NOT NULL,
  lon             REAL    NOT NULL,
  lat             REAL    NOT NULL,
  "osmType"       TEXT    NOT NULL,
  "osmId"         INTEGER NOT NULL,
  name            TEXT, -- name with diacritics - ONLY IF it differs from nameRaw
  "nameRaw"       TEXT, -- name without diacritics (always present, or NULL)
  "routeCount"    INTEGER,
  "hasImages"     INTEGER, -- bool
  line            TEXT, -- geometry coordinates JSON
  "gradeTxt"      TEXT,
  "gradeId"       INTEGER,
  "histogramCode" TEXT,
  "parentId"      INTEGER,
  materials       TEXT, -- comma-joined climbing:rock values
  "climbingTypes" TEXT, -- comma-joined climbing types (sport, trad, ...)
  inclinations    TEXT, -- comma-joined inclinations (slab, vertical, ...)
  "familyFriendly" INTEGER, -- bool
  tags            TEXT, -- JSON object of all OSM tags
  members         TEXT -- JSON array of relation members (relations only)
);

CREATE TABLE climbing_tiles_cache
(
  zxy           TEXT NOT NULL PRIMARY KEY,
  tile_geojson  TEXT NOT NULL, -- JSON
  duration      INTEGER,
  feature_count INTEGER
);

CREATE TABLE climbing_tiles_stats
(
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp              TEXT,
  osm_data_timestamp     TEXT,
  build_log              TEXT,
  build_duration         INTEGER,
  max_size               INTEGER,
  max_size_zxy           TEXT,
  max_time               INTEGER,
  max_time_zxy           TEXT,
  groups_count           INTEGER,
  groups_with_name_count INTEGER,
  routes_count           INTEGER
);

CREATE TABLE climbing_ticks
(
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  "osmUserId" INTEGER NOT NULL,
  "osmType"   TEXT,
  "osmId"     INTEGER,
  timestamp   TEXT    NOT NULL,
  style       TEXT,
  "myGrade"   TEXT,
  note        TEXT,
  pairing     TEXT
);

CREATE TABLE osm_user_display_names
(
  "osmUserId"   INTEGER PRIMARY KEY NOT NULL,
  "displayName" TEXT NOT NULL
);

CREATE INDEX idx_osm_user_display_name_lower
  ON osm_user_display_names (lower("displayName"));

CREATE TABLE user_lists
(
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  "osmUserId" INTEGER NOT NULL,
  name        TEXT    NOT NULL,
  emoji       TEXT    NOT NULL,
  color       TEXT    NOT NULL DEFAULT '#FFFFFF',
  "createdAt" TEXT    NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_user_lists_user ON user_lists ("osmUserId");

CREATE TABLE user_list_items
(
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  "listId"  INTEGER NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  "shortId" TEXT    NOT NULL,
  label     TEXT    NOT NULL,
  "poiType" TEXT    NOT NULL,
  lon       REAL    NOT NULL,
  lat       REAL    NOT NULL,
  "addedAt" TEXT    NOT NULL,
  UNIQUE ("listId", "shortId")
);

CREATE INDEX idx_user_list_items_list ON user_list_items ("listId");

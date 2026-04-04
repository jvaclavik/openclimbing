import BetterSqlite3, { type Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data/db.sqlite');
const SCHEMA_PATH = path.resolve(process.cwd(), 'src/server/db/schema.sql');

const getDbVersion = (db: Database) => {
  const result = db
    .prepare<[], { user_version: number }>('PRAGMA user_version')
    .get();
  return result.user_version;
};

/**
 * Ensures optional tables exist even if user_version was bumped without them
 * (e.g. partial deploy, manual DB edit, or schema drift). Runs every getDb().
 */
const ensureOsmUserDisplayNamesTable = (db: Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS osm_user_display_names
    (
      "osmUserId"   INTEGER PRIMARY KEY NOT NULL,
      "displayName" TEXT NOT NULL
    );
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_osm_user_display_name_lower
      ON osm_user_display_names (lower("displayName"));
  `);
};

/**
 * Applies version-based migrations. Must run on every getDb() (see HMR cache).
 */
const runPendingMigrations = (db: Database) => {
  const v = getDbVersion(db);
  if (v === 1) {
    db.transaction(() => {
      db.pragma('user_version = 2');
    })();

    console.log(`Database ${DB_PATH} migrated from version 1 to 2`); // eslint-disable-line no-console
  }
};

// global to allow hot-reload in dev
const store = global as unknown as { db: Database | undefined };

export function getDb() {
  if (!store.db) {
    const db = new BetterSqlite3(DB_PATH);

    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    if (getDbVersion(db) === 0) {
      db.transaction(() => {
        db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
        db.pragma('user_version = 2');
      })();

      console.log(`Database ${DB_PATH} initialized to version 2`); // eslint-disable-line no-console
    }

    store.db = db;
  }

  ensureOsmUserDisplayNamesTable(store.db);
  runPendingMigrations(store.db);

  return store.db;
}

// TODO use global const DB - but develop a way to disable it, eg. for vercel
// currently throws TypeError: Cannot open database because the directory does not exist
//export const DB = getDb();

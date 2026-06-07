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

const createUserListsTables = (db: Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_lists
    (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      "osmUserId" INTEGER NOT NULL,
      name        TEXT    NOT NULL,
      emoji       TEXT    NOT NULL,
      color       TEXT    NOT NULL DEFAULT '#FFFFFF',
      "createdAt" TEXT    NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0
    );
  `);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_user_lists_user ON user_lists ("osmUserId");`,
  );
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_list_items
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
  `);
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_user_list_items_list ON user_list_items ("listId");`,
  );
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
  if (getDbVersion(db) === 2) {
    db.transaction(() => {
      createUserListsTables(db);
      db.pragma('user_version = 3');
    })();

    console.log(`Database ${DB_PATH} migrated from version 2 to 3`); // eslint-disable-line no-console
  }
  if (getDbVersion(db) === 3) {
    db.transaction(() => {
      const hasColor = db
        .prepare<[], { name: string }>(`PRAGMA table_info(user_lists)`)
        .all()
        .some((c) => c.name === 'color');
      if (!hasColor) {
        db.exec(
          `ALTER TABLE user_lists ADD COLUMN color TEXT NOT NULL DEFAULT '#FFFFFF';`,
        );
      }
      db.pragma('user_version = 4');
    })();

    console.log(`Database ${DB_PATH} migrated from version 3 to 4`); // eslint-disable-line no-console
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
        db.pragma('user_version = 4');
      })();

      console.log(`Database ${DB_PATH} initialized to version 4`); // eslint-disable-line no-console
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

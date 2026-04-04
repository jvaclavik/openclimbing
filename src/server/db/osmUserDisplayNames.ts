import type { Database } from 'better-sqlite3';
import type { ServerOsmUser } from '../osmApiAuthServer';

export const upsertOsmUserDisplayName = (
  db: Database,
  user: ServerOsmUser,
): void => {
  db.prepare(
    `INSERT INTO osm_user_display_names ("osmUserId", "displayName")
     VALUES (@osmUserId, @displayName)
     ON CONFLICT("osmUserId") DO UPDATE SET
       "displayName" = excluded."displayName"`,
  ).run({ osmUserId: user.id, displayName: user.username });
};

export const findOsmUserIdByDisplayName = (
  db: Database,
  displayName: string,
): number | undefined => {
  const row = db
    .prepare<[string], { osmUserId: number }>(
      `SELECT "osmUserId" FROM osm_user_display_names
       WHERE lower("displayName") = lower(?)
       LIMIT 1`,
    )
    .get(displayName.trim());
  return row?.osmUserId;
};

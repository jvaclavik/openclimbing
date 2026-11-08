import type { Database } from 'better-sqlite3';
import { ClimbingTickDb } from '../../types';
import { climbingTickDbsToResponseTicks } from '../db/enrichClimbingTicksWithRouteMeta';
import { getPartnersText } from '../../services/my-ticks/tickPairing';
import {
  isUserMentioned,
  MentionedClimbingTick,
} from '../../services/my-ticks/tickMentions';

const MAX_MENTIONS = 2000;

const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

/**
 * Ticks of other users with `@username` in their partners text. Only ticks
 * linked to an OSM route — those can be copied to the user's own diary.
 */
export const getTicksMentioningUser = (
  db: Database,
  osmUserId: number,
  username: string,
): MentionedClimbingTick[] => {
  // Cheap pre-filter in SQL (LIKE is case-insensitive for ASCII), exact
  // mention matching in JS.
  const candidates = db
    .prepare<[number, string], ClimbingTickDb>(
      `SELECT * FROM climbing_ticks
       WHERE "osmUserId" != ?
         AND "osmId" IS NOT NULL
         AND pairing LIKE ? ESCAPE '\\'
       ORDER BY timestamp DESC
       LIMIT ${MAX_MENTIONS * 2}`,
    )
    .all(osmUserId, `%@${escapeLike(username)}%`);

  const ticks = climbingTickDbsToResponseTicks(db, candidates)
    .filter((tick) => isUserMentioned(getPartnersText(tick), username))
    .slice(0, MAX_MENTIONS);

  const ownerIds = [...new Set(ticks.map((tick) => tick.osmUserId))];
  const names = new Map<number, string>();
  if (ownerIds.length > 0) {
    const placeholders = ownerIds.map(() => '?').join(', ');
    db.prepare<number[], { osmUserId: number; displayName: string }>(
      `SELECT "osmUserId", "displayName" FROM osm_user_display_names
       WHERE "osmUserId" IN (${placeholders})`,
    )
      .all(...ownerIds)
      .forEach((row) => names.set(row.osmUserId, row.displayName));
  }

  return ticks.map((tick) => ({
    ...tick,
    ownerDisplayName: names.get(tick.osmUserId) ?? null,
  }));
};

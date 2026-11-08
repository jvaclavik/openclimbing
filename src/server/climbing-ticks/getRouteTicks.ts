import type { Database } from 'better-sqlite3';
import { ClimbingTickDb } from '../../types';
import { convertClimbingTickFromDb } from '../../services/my-ticks/myTicksApi';
import type { MentionedClimbingTick } from '../../services/my-ticks/tickMentions';

const MAX_ROUTE_TICKS = 500;

export const OSM_TYPES = ['node', 'way', 'relation'] as const;

/** All climbers' ticks of one route, newest first, with display names. */
export const getRouteTicks = (
  db: Database,
  osmType: string,
  osmId: number,
): MentionedClimbingTick[] => {
  const rows = db
    .prepare<
      [string, number],
      ClimbingTickDb & { ownerDisplayName: string | null }
    >(
      `SELECT t.*, d."displayName" AS "ownerDisplayName"
       FROM climbing_ticks t
       LEFT JOIN osm_user_display_names d ON d."osmUserId" = t."osmUserId"
       WHERE t."osmType" = ? AND t."osmId" = ?
       ORDER BY t.timestamp DESC, t.id DESC
       LIMIT ${MAX_ROUTE_TICKS}`,
    )
    .all(osmType, osmId);

  return rows.map(({ ownerDisplayName, ...row }) => ({
    ...convertClimbingTickFromDb(row),
    ownerDisplayName: ownerDisplayName ?? null,
  }));
};

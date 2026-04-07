import type { Database } from 'better-sqlite3';
import { ClimbingTick, ClimbingTickDb } from '../../types';
import { climbingTickDbsToResponseTicks } from '../db/enrichClimbingTicksWithRouteMeta';
import { computeTickPointsForLeaderboard } from '../../services/my-ticks/tickScoring';
import { getLeaderboardPeriodStartIso } from '../../services/my-ticks/leaderboardPeriod';
import type { ClimbingStatsDateRange } from '../../services/my-ticks/climbingStatsDateRange';

export type LeaderboardEntry = {
  osmUserId: number;
  displayName: string;
  points: number;
  tickCount: number;
};

function periodToWhere(range: ClimbingStatsDateRange): {
  sql: string;
  params: string[];
} {
  if (range.mode === 'all') {
    return { sql: '1=1', params: [] };
  }
  if (range.mode === 'rolling365') {
    return { sql: 'timestamp >= ?', params: [getLeaderboardPeriodStartIso()] };
  }
  const start = new Date(Date.UTC(range.year, 0, 1, 0, 0, 0, 0)).toISOString();
  const end = new Date(
    Date.UTC(range.year + 1, 0, 1, 0, 0, 0, 0),
  ).toISOString();
  return { sql: 'timestamp >= ? AND timestamp < ?', params: [start, end] };
}

function periodBoundsIso(range: ClimbingStatsDateRange): {
  periodStartIso: string | null;
  periodEndIso: string | null;
} {
  const now = new Date().toISOString();
  if (range.mode === 'rolling365') {
    return {
      periodStartIso: getLeaderboardPeriodStartIso(),
      periodEndIso: now,
    };
  }
  if (range.mode === 'year') {
    return {
      periodStartIso: new Date(
        Date.UTC(range.year, 0, 1, 0, 0, 0, 0),
      ).toISOString(),
      periodEndIso: new Date(
        Date.UTC(range.year, 11, 31, 23, 59, 59, 999),
      ).toISOString(),
    };
  }
  return { periodStartIso: null, periodEndIso: null };
}

function queryAvailableYears(db: Database): number[] {
  const rows = db
    .prepare<[], { y: string }>(
      `SELECT DISTINCT substr(timestamp, 1, 4) AS y
       FROM climbing_ticks
       WHERE length(timestamp) >= 4
       ORDER BY y DESC`,
    )
    .all();
  return rows
    .map((r) => parseInt(r.y, 10))
    .filter((n) => Number.isFinite(n) && n >= 1970 && n <= 2100);
}

function queryTimestampBounds(db: Database): {
  min: string | null;
  max: string | null;
} {
  const row = db
    .prepare<
      [],
      { mn: string | null; mx: string | null }
    >('SELECT MIN(timestamp) AS mn, MAX(timestamp) AS mx FROM climbing_ticks')
    .get();
  return { min: row?.mn ?? null, max: row?.mx ?? null };
}

export function computeClimbingTicksLeaderboard(
  db: Database,
  limit = 100,
  range: ClimbingStatsDateRange,
): {
  entries: LeaderboardEntry[];
  periodStartIso: string | null;
  periodEndIso: string | null;
  availableYears: number[];
} {
  const availableYears = queryAvailableYears(db);
  const { sql: whereSql, params: whereParams } = periodToWhere(range);
  const rows = db
    .prepare(`SELECT * FROM climbing_ticks WHERE ${whereSql}`)
    .all(...whereParams) as ClimbingTickDb[];

  let periodStartIso: string | null;
  let periodEndIso: string | null;
  if (range.mode === 'all') {
    const b = queryTimestampBounds(db);
    periodStartIso = b.min;
    periodEndIso = b.max;
  } else {
    const b = periodBoundsIso(range);
    periodStartIso = b.periodStartIso;
    periodEndIso = b.periodEndIso;
  }

  if (rows.length === 0) {
    return {
      entries: [],
      periodStartIso,
      periodEndIso,
      availableYears,
    };
  }

  const ticks = climbingTickDbsToResponseTicks(db, rows);
  const sums = new Map<number, { points: number; count: number }>();

  ticks.forEach((tick: ClimbingTick) => {
    const uid = tick.osmUserId;
    if (uid == null || !Number.isFinite(uid)) {
      return;
    }
    const pts = computeTickPointsForLeaderboard({
      style: tick.style,
      routeGradeTxt: tick.routeGradeTxt,
      myGrade: tick.myGrade,
    });
    const cur = sums.get(uid) ?? { points: 0, count: 0 };
    cur.points += pts;
    cur.count += 1;
    sums.set(uid, cur);
  });

  const ids = [...sums.keys()];
  if (ids.length === 0) {
    return {
      entries: [],
      periodStartIso,
      periodEndIso,
      availableYears,
    };
  }

  const placeholders = ids.map(() => '?').join(', ');
  const nameRows = db
    .prepare<
      number[],
      { osmUserId: number; displayName: string }
    >(`SELECT "osmUserId", "displayName" FROM osm_user_display_names WHERE "osmUserId" IN (${placeholders})`)
    .all(...ids);

  const entries: LeaderboardEntry[] = nameRows
    .map((nr) => {
      const agg = sums.get(nr.osmUserId);
      return {
        osmUserId: nr.osmUserId,
        displayName: nr.displayName,
        points: agg?.points ?? 0,
        tickCount: agg?.count ?? 0,
      };
    })
    .filter((e) => e.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);

  return { entries, periodStartIso, periodEndIso, availableYears };
}

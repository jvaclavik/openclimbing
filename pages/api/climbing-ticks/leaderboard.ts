import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../src/server/db/db';
import { computeClimbingTicksLeaderboard } from '../../../src/server/climbing-ticks/getClimbingTicksLeaderboard';
import {
  climbingStatsDateRangeToSelectValue,
  parseLeaderboardQueryRange,
} from '../../../src/services/my-ticks/climbingStatsDateRange';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').end();
    return;
  }

  try {
    const db = getDb();
    const range = parseLeaderboardQueryRange(req.query.range);
    const { entries, periodStartIso, periodEndIso, availableYears } =
      computeClimbingTicksLeaderboard(db, 100, range);
    res.status(200).json({
      entries,
      periodStartIso,
      periodEndIso,
      availableYears,
      periodRange: climbingStatsDateRangeToSelectValue(range),
    });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};

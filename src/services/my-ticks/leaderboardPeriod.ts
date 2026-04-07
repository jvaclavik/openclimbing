/** Valivé období pro žebříček a součet „bodů za rok“ v profilu (365 dní). */
export const LEADERBOARD_ROLLING_DAYS = 365;

export function getLeaderboardPeriodStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - LEADERBOARD_ROLLING_DAYS);
  return d;
}

export function getLeaderboardPeriodStartIso(): string {
  return getLeaderboardPeriodStart().toISOString();
}

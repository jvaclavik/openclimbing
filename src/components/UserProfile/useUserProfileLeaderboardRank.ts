import { useEffect, useState } from 'react';
import { fetchClimbingTicksLeaderboard } from '../../services/my-ticks/myTicksApi';

export function useUserProfileLeaderboardRank(
  displayName: string,
  rangeSelectValue: string,
): number | null {
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchClimbingTicksLeaderboard(rangeSelectValue)
      .then((data) => {
        if (cancelled) return;
        const idx = data.entries.findIndex(
          (e) => e.displayName === displayName,
        );
        setRank(idx >= 0 ? idx + 1 : null);
      })
      .catch(() => {
        if (!cancelled) setRank(null);
      });
    return () => {
      cancelled = true;
    };
  }, [displayName, rangeSelectValue]);

  return rank;
}

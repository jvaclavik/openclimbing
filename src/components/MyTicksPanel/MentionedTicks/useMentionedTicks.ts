import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { fetchMentionedClimbingTicks } from '../../../services/my-ticks/myTicksApi';
import {
  getAlreadyLoggedMentionIds,
  MentionedClimbingTick,
} from '../../../services/my-ticks/tickMentions';
import { useTicksContext } from '../../utils/TicksContext';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';

export const useMentionedTicks = (enabled: boolean) => {
  const { loggedIn, osmUser } = useOsmAuthContext();
  const active = enabled && loggedIn && !!osmUser;
  // Per-account key and no keepPreviousData: after switching accounts the
  // previous user's mentions must never show up (or be copied).
  const { data, error, isFetched } = useQuery<MentionedClimbingTick[]>({
    queryKey: ['climbing-ticks-mentions', osmUser],
    queryFn: fetchMentionedClimbingTicks,
    enabled: active,
    staleTime: 60_000,
  });
  return {
    mentionedTicks: active ? (data ?? []) : [],
    isLoading: active && !isFetched,
    error,
  };
};

/** Mentioned ticks + which of them the user already has in the diary. */
export const useMentionedTicksState = (enabled: boolean) => {
  const { ticks: ownTicks } = useTicksContext();
  const { mentionedTicks, isLoading, error } = useMentionedTicks(enabled);
  const alreadyLoggedIds = useMemo(
    () => getAlreadyLoggedMentionIds(mentionedTicks, ownTicks ?? []),
    [mentionedTicks, ownTicks],
  );
  return {
    mentionedTicks,
    alreadyLoggedIds,
    pendingCount: mentionedTicks.length - alreadyLoggedIds.size,
    isLoading,
    error,
  };
};

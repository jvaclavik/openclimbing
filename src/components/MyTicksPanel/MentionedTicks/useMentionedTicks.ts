import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { fetchMentionedClimbingTicks } from '../../../services/my-ticks/myTicksApi';
import {
  getAlreadyLoggedMentionIds,
  MentionedClimbingTick,
} from '../../../services/my-ticks/tickMentions';
import { useTicksContext } from '../../utils/TicksContext';

export const MENTIONED_TICKS_QUERY_KEY = ['climbing-ticks-mentions'];

export const useMentionedTicks = (enabled: boolean) => {
  const { data, error, isFetched } = useQuery<MentionedClimbingTick[]>({
    queryKey: MENTIONED_TICKS_QUERY_KEY,
    queryFn: fetchMentionedClimbingTicks,
    enabled,
    keepPreviousData: true,
    staleTime: 60_000,
  });
  return {
    mentionedTicks: data ?? [],
    isLoading: enabled && !isFetched,
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

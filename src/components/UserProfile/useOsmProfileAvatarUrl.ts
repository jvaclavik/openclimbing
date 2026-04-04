import { useQuery } from 'react-query';
import { fetchJson } from '../../services/fetch';
import { useOsmAuthContext } from '../utils/OsmAuthContext';

type AvatarApiResponse = { imageUrl: string | null };

export const useOsmProfileAvatarUrl = (displayName: string | undefined) => {
  const { loggedIn, osmUser, userImage } = useOsmAuthContext();
  const normalized = displayName?.trim() ?? '';

  const isSelf = loggedIn && normalized !== '' && osmUser === normalized;

  const q = useQuery({
    queryKey: ['osm-user-avatar', normalized],
    queryFn: () =>
      fetchJson<AvatarApiResponse>(
        `/api/osm-user-avatar/${encodeURIComponent(normalized)}`,
      ).then((r) => r.imageUrl),
    enabled: Boolean(normalized) && !isSelf,
    staleTime: 86_400_000,
  });

  const imageUrl = isSelf ? userImage || null : (q.data ?? null);
  const isLoading = isSelf ? false : q.isLoading;

  return { imageUrl, isLoading };
};

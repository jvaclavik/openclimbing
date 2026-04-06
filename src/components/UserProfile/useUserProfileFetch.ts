import { useEffect, useState } from 'react';
import { FetchError } from '../../services/helpers';
import { fetchPublicClimbingTicksByDisplayName } from '../../services/my-ticks/myTicksApi';
import { ClimbingTick } from '../../types';

export type UserProfileFetchState =
  | { kind: 'loading' }
  | { kind: 'unknown' }
  | { kind: 'error' }
  | { kind: 'ready'; displayName: string; ticks: ClimbingTick[] };

function tryDecodeDisplayName(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

export const useUserProfileFetch = (
  displayNameParam: string,
  options?: { skip?: boolean },
) => {
  const skip = options?.skip === true;
  const [state, setState] = useState<UserProfileFetchState>({
    kind: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    if (skip) {
      setState({
        kind: 'ready',
        displayName: tryDecodeDisplayName(displayNameParam),
        ticks: [],
      });
      return undefined;
    }

    setState({ kind: 'loading' });

    fetchPublicClimbingTicksByDisplayName(displayNameParam)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setState({
          kind: 'ready',
          displayName: data.displayName,
          ticks: data.ticks,
        });
      })
      .catch((e) => {
        if (cancelled) {
          return;
        }
        if (e instanceof FetchError && e.code === '404') {
          setState({ kind: 'unknown' });
          return;
        }
        setState({ kind: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [displayNameParam, skip]);

  return state;
};

import { useRouter } from 'next/router';
import type { NextRouter } from 'next/router';
import { useMemo } from 'react';
import { FetchedClimbingTick } from './getMyTicks';

export type TicksUrlFilter = {
  /** YYYY-MM-DD — restricts visible ticks to a single calendar day. */
  session?: string;
  /** Numeric DB id of a tick to highlight (scroll-to + pulse). */
  highlightTickId?: number;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const readQueryString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

export const useTicksUrlFilter = (): TicksUrlFilter => {
  const router = useRouter();
  const session = readQueryString(router.query.session);
  const tick = readQueryString(router.query.tick);

  return useMemo(() => {
    const out: TicksUrlFilter = {};
    if (session && ISO_DATE_RE.test(session)) {
      out.session = session;
    }
    if (tick) {
      const parsed = Number.parseInt(tick, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        out.highlightTickId = parsed;
      }
    }
    return out;
  }, [session, tick]);
};

export const isTicksFilterActive = (f: TicksUrlFilter): boolean =>
  Boolean(f.session || f.highlightTickId);

export const matchesTicksFilter = (
  row: FetchedClimbingTick,
  f: TicksUrlFilter,
): boolean => {
  if (f.session && !row.date.startsWith(f.session)) return false;
  return true;
};

export const applyTicksUrlFilter = (
  rows: FetchedClimbingTick[],
  f: TicksUrlFilter,
): FetchedClimbingTick[] => {
  if (!f.session) return rows;
  return rows.filter((row) => matchesTicksFilter(row, f));
};

export const clearTicksUrlFilter = (router: NextRouter): void => {
  const nextQuery = { ...router.query };
  delete nextQuery.session;
  delete nextQuery.tick;
  router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
    shallow: true,
    scroll: false,
  });
};

type ShareUrlOptions = {
  session?: string;
  tickId?: number;
};

export const buildTickShareUrl = (
  baseUrl: string,
  displayName: string,
  opts: ShareUrlOptions,
): string => {
  const params = new URLSearchParams();
  if (opts.session) params.set('session', opts.session);
  if (opts.tickId != null) params.set('tick', String(opts.tickId));
  const query = params.toString();
  const path = `/u/${encodeURIComponent(displayName)}`;
  return `${baseUrl}${path}${query ? `?${query}` : ''}`;
};

/** Extracts YYYY-MM-DD from an ISO timestamp without timezone surprises. */
export const sessionDateFromTimestamp = (timestamp: string): string =>
  timestamp.slice(0, 10);

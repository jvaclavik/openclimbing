import { ClimbingTick } from '../../types';

export const PARTNERS_PAIRING_KEY = 'partners';

export const parsePairing = (raw: unknown): Record<string, string> | null => {
  if (raw == null || raw === '') {
    return null;
  }
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      return null;
    }
  }
  return null;
};

export const stringifyPairing = (
  pairing: Record<string, string> | null,
): string | null => {
  if (!pairing || Object.keys(pairing).length === 0) {
    return null;
  }
  return JSON.stringify(pairing);
};

/** Value stored in SQLite `pairing` TEXT column. */
export const normalizePairingForDb = (raw: unknown): string | null =>
  stringifyPairing(parsePairing(raw));

export const getPartnersText = (tick: ClimbingTick): string =>
  tick.pairing?.[PARTNERS_PAIRING_KEY] ?? '';

export const setPartnersOnPairing = (
  pairing: Record<string, string> | null | undefined,
  partners: string,
): Record<string, string> | null => {
  const next: Record<string, string> = { ...(pairing ?? {}) };
  if (partners.trim() === '') {
    delete next[PARTNERS_PAIRING_KEY];
  } else {
    next[PARTNERS_PAIRING_KEY] = partners;
  }
  return Object.keys(next).length > 0 ? next : null;
};

/** @nicknames from free text (OSM-style mentions). */
export const extractMentionNicknames = (text: string): string[] => {
  const re = /@([^\s@]+)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[1]);
  }
  return out;
};

export const collectPartnerSuggestionsFromTicks = (
  ticks: ClimbingTick[],
): string[] => {
  const set = new Set<string>();
  for (const tick of ticks) {
    for (const nick of extractMentionNicknames(getPartnersText(tick))) {
      set.add(nick);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
};

const byTimestampDesc = (a: ClimbingTick, b: ClimbingTick) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

/**
 * Partners text from the most recent other tick on the same route; if none,
 * from the most recent other tick on any route.
 */
export const getPartnersFromLastClimbedRoute = (
  ticks: ClimbingTick[],
  currentTick: ClimbingTick,
): string | null => {
  const sid = currentTick.shortId;
  if (sid) {
    const sameRoute = ticks
      .filter((t) => t.shortId === sid && t.id !== currentTick.id)
      .sort(byTimestampDesc);
    for (const t of sameRoute) {
      const p = getPartnersText(t).trim();
      if (p) {
        return p;
      }
    }
  }

  const anyOther = ticks
    .filter((t) => t.id !== currentTick.id)
    .sort(byTimestampDesc);
  for (const t of anyOther) {
    const p = getPartnersText(t).trim();
    if (p) {
      return p;
    }
  }
  return null;
};

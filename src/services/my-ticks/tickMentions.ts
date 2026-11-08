import { ClimbingTick } from '../../types';
import {
  extractMentionNicknames,
  getPartnersText,
  setPartnersOnPairing,
} from './tickPairing';
import { sessionDateFromTimestamp } from './ticksUrlFilter';

/** Tick of another user that mentions the current user in partners. */
export type MentionedClimbingTick = ClimbingTick & {
  /** OSM display name of the user who logged the tick. */
  ownerDisplayName: string | null;
};

// "@pepa," / "@pepa." / "(@pepa)" → "pepa"
const TRAILING_PUNCTUATION = /[.,;:!?)\]}"'»“”]+$/u;

export const normalizeMentionNick = (nick: string): string =>
  nick.replace(TRAILING_PUNCTUATION, '').toLowerCase();

export const isUserMentioned = (
  partnersText: string,
  username: string,
): boolean => {
  const target = username.trim().toLowerCase();
  if (!target) return false;
  return extractMentionNicknames(partnersText).some(
    (nick) => normalizeMentionNick(nick) === target,
  );
};

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Partners text for the copied tick: mentions of me become a mention of the
 * tick owner (who climbed with me). Other partners are kept.
 */
export const buildPartnersForCopy = (
  partnersText: string,
  myUsername: string,
  ownerDisplayName: string | null,
): string => {
  const ownerMention = ownerDisplayName ? `@${ownerDisplayName}` : '';
  const ownerAlreadyMentioned =
    !!ownerDisplayName && isUserMentioned(partnersText, ownerDisplayName);

  const re = new RegExp(
    `@${escapeRegExp(myUsername)}(?=$|[\\s.,;:!?)\\]}"'»“”])`,
    'giu',
  );
  let replaced = false;
  const text = partnersText.replace(re, () => {
    if (replaced || ownerAlreadyMentioned) return '';
    replaced = true;
    return ownerMention;
  });

  const cleaned = text
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleaned && ownerMention) return ownerMention;
  if (ownerMention && !replaced && !ownerAlreadyMentioned) {
    return `${cleaned} ${ownerMention}`.trim();
  }
  return cleaned;
};

const ownTickKey = (shortId: string, timestamp: string) =>
  `${shortId}|${sessionDateFromTimestamp(timestamp)}`;

/** Ids of mentioned ticks I already have (same route, same day). */
export const getAlreadyLoggedMentionIds = (
  mentioned: ClimbingTick[],
  ownTicks: ClimbingTick[],
): Set<number> => {
  const own = new Set(
    ownTicks
      .filter((tick) => tick.shortId)
      .map((tick) => ownTickKey(tick.shortId, tick.timestamp)),
  );
  return new Set(
    mentioned
      .filter(
        (tick) =>
          tick.shortId && own.has(ownTickKey(tick.shortId, tick.timestamp)),
      )
      .map((tick) => tick.id),
  );
};

export type CopyStyleOption =
  | { kind: 'original' }
  | { kind: 'fixed'; style: string };

/** New tick (for me) created from someone else's tick that mentions me. */
export const buildTickCopy = (
  source: MentionedClimbingTick,
  myUsername: string,
  styleOption: CopyStyleOption = { kind: 'original' },
): Partial<ClimbingTick> => ({
  shortId: source.shortId,
  timestamp: source.timestamp,
  style: styleOption.kind === 'fixed' ? styleOption.style : source.style,
  pairing: setPartnersOnPairing(
    null,
    buildPartnersForCopy(
      getPartnersText(source),
      myUsername,
      source.ownerDisplayName,
    ),
  ),
});

import {
  isValidOsmShortId,
  normalizeOsmShortIdKey,
} from '../../../../../services/helpers';

const TYPE_PREFIX: Record<string, string> = {
  node: 'n',
  way: 'w',
  relation: 'r',
};

const PATH_ID = /(?:^|\/)(node|way|relation)\/(\d+)/i;

/** Turns an OSM/OpenClimbing URL or `r123` short id into `n|w|r` + id. */
export const parseOsmShortId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isValidOsmShortId(trimmed)) {
    return normalizeOsmShortIdKey(trimmed);
  }

  const fromPath = (path: string) => {
    const match = path.match(PATH_ID);
    if (!match) return null;
    return `${TYPE_PREFIX[match[1].toLowerCase()]}${match[2]}`;
  };

  try {
    return fromPath(new URL(trimmed).pathname);
  } catch {
    return fromPath(trimmed);
  }
};

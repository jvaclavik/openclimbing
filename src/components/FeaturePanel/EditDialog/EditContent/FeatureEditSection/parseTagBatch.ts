import { FeatureTags } from '../../../../../services/types';

const OSM_KEY = /^[a-zA-Z][a-zA-Z0-9:_-]*$/;

const isOsmTagLine = (line: string) => {
  const eq = line.indexOf('=');
  if (eq <= 0) return false;
  return OSM_KEY.test(line.slice(0, eq).trim());
};

const parseTagBlock = (block: string): FeatureTags => {
  const tags: FeatureTags = {};
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const eq = line.indexOf('=');
    const key = line.slice(0, eq).trim();
    tags[key] = line.slice(eq + 1).trim();
  }
  return tags;
};

/**
 * Parses a paste of OSM tags where each route is a block of `key=value` lines
 * separated by a blank line. Returns null when the text is the older
 * one-route-per-line format (or anything else).
 */
export const parseTagBatch = (text: string): FeatureTags[] | null => {
  const normalized = text.replace(/\r\n/g, '\n');
  const nonEmpty = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (nonEmpty.length === 0 || !nonEmpty.every(isOsmTagLine)) {
    return null;
  }

  return normalized
    .trim()
    .split(/\n[ \t]*\n+/)
    .map(parseTagBlock)
    .filter((tags) => Object.keys(tags).length > 0);
};

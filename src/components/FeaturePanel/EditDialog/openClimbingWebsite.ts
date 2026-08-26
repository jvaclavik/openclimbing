import { Feature, FeatureTags } from '../../../services/types';
import { getApiId, getUrlOsmId } from '../../../services/helpers';
import { hasPathOnPhoto } from '../Climbing/utils/photo';
import { TagsEntries } from './context/types';
import { EditDataItem } from './context/types';

const OPEN_CLIMBING_ORIGIN = 'https://openclimbing.org';

// website, website:2, website:3 … – the slots we shift when inserting our link
const WEBSITE_KEY_REGEX = /^website(:\d+)?$/;

// any tag which could already carry the link – checked before we do anything
const ANY_WEBSITE_KEY_REGEX = /^(contact:)?website(:\d+)?$/;

const OPEN_CLIMBING_URL_REGEX = /^https?:\/\/(www\.)?openclimbing\.org(\/|$)/i;

export const getOpenClimbingUrl = (shortId: string) =>
  `${OPEN_CLIMBING_ORIGIN}/${getUrlOsmId(getApiId(shortId))}`;

const isOpenClimbingUrl = (value: string) =>
  OPEN_CLIMBING_URL_REGEX.test((value ?? '').trim());

export const hasOpenClimbingLink = (tags: FeatureTags) =>
  Object.entries(tags).some(
    ([key, value]) =>
      ANY_WEBSITE_KEY_REGEX.test(key) && isOpenClimbingUrl(value),
  );

const getSlotKey = (index: number) =>
  index === 1 ? 'website' : `website:${index}`;

const getSlotIndex = (key: string) => {
  const suffix = key.slice('website:'.length);
  return key === 'website' ? 1 : parseInt(suffix, 10);
};

const getWebsiteValues = (entries: TagsEntries) =>
  entries
    .filter(([key]) => WEBSITE_KEY_REGEX.test(key))
    .sort(([a], [b]) => getSlotIndex(a) - getSlotIndex(b))
    .map(([, value]) => value);

// Rewrites all website* slots to the given list, keeping the position of the
// first website tag among the other tags.
const setWebsiteValues = (
  entries: TagsEntries,
  values: string[],
): TagsEntries => {
  const firstIndex = entries.findIndex(([key]) => WEBSITE_KEY_REGEX.test(key));
  const others = entries.filter(([key]) => !WEBSITE_KEY_REGEX.test(key));
  const websites: TagsEntries = values.map((value, index) => [
    getSlotKey(index + 1),
    value,
  ]);
  const insertAt = firstIndex === -1 ? others.length : firstIndex;
  return [...others.slice(0, insertAt), ...websites, ...others.slice(insertAt)];
};

/**
 * Puts our link into the main `website` tag and shifts the websites which were
 * there one slot up (website → website:2 → website:3 …).
 */
export const addOpenClimbingWebsite = (
  entries: TagsEntries,
  url: string,
): TagsEntries =>
  getWebsiteValues(entries).some(isOpenClimbingUrl)
    ? entries
    : setWebsiteValues(entries, [url, ...getWebsiteValues(entries)]);

/** Exact inverse of addOpenClimbingWebsite() – shifts the other websites back down. */
export const removeOpenClimbingWebsite = (
  entries: TagsEntries,
  url: string,
): TagsEntries => {
  const values = getWebsiteValues(entries);
  if (!values.some((value) => value.trim() === url)) {
    return entries;
  }
  return setWebsiteValues(
    entries,
    values.filter((value) => value.trim() !== url),
  );
};

export const isCragOrArea = (tags: FeatureTags) =>
  tags.climbing === 'crag' || tags.climbing === 'area';

/**
 * Crags load their routes as members, areas load the whole tree recursively
 * (see addMemberFeaturesToArea()), so a single walk answers it for both.
 */
export const featureHasDrawnRoutes = (feature: Feature): boolean =>
  (feature?.memberFeatures ?? []).some(
    (member) =>
      hasPathOnPhoto(member.tags ?? {}) || featureHasDrawnRoutes(member),
  );

/** Fallback for crags – the edit item keeps the original tags of its members. */
export const itemHasDrawnRoutes = (item: EditDataItem) =>
  (item?.members ?? []).some(({ originalTags }) =>
    hasPathOnPhoto(originalTags ?? {}),
  );

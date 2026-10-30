import { getApiId } from '../../../../../services/helpers';
import { FeatureTags } from '../../../../../services/types';

const STORAGE_KEY = 'editdialog.recentParents';
const MAX_RECENT = 10;

type ParentType = 'area' | 'crag';

export type RecentParent = {
  shortId: string;
  name: string;
  type: ParentType;
};

const readAll = (): RecentParent[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // storage blocked or corrupted
  }
};

export const getRecentParents = (type: ParentType) =>
  readAll().filter((recent) => recent.type === type);

// Only areas and crags already in OSM – a new relation has no stable id yet.
export const rememberParent = (shortId: string, tags: FeatureTags) => {
  const type = tags.climbing;
  if (getApiId(shortId).id < 0 || (type !== 'area' && type !== 'crag')) {
    return;
  }

  const recent: RecentParent = { shortId, name: tags.name ?? shortId, type };
  const next = [
    recent,
    ...readAll().filter((item) => item.shortId !== shortId),
  ].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage blocked – nothing to remember
  }
};

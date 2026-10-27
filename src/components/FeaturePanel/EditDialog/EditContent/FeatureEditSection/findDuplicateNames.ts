import { DataItem, Members } from '../../context/types';
import { findInItems, getName } from '../../context/utils';

const normalizeName = (name?: string) => name?.trim().toLowerCase() ?? '';

// Names of new members already used by another member of the relation (or
// repeated within the new ones). Only a warning: routes may share a name.
export const findDuplicateNames = (
  members: Members,
  newMembers: Members,
  items: DataItem[],
) => {
  const memberIds = new Set(members.map(({ shortId }) => shortId));
  const seen = new Set(
    members
      .map((member) => {
        const item = findInItems(items, member.shortId);
        return normalizeName(item ? getName(item) : member.originalTags?.name);
      })
      .filter(Boolean),
  );

  const duplicates: string[] = [];
  for (const { shortId, originalTags } of newMembers) {
    const name = originalTags?.name;
    const key = normalizeName(name);
    // unnamed, or already a member (such drafts are skipped when adding)
    if (!key || memberIds.has(shortId)) {
      continue;
    }
    if (seen.has(key)) {
      duplicates.push(name);
    }
    seen.add(key);
  }
  return duplicates;
};

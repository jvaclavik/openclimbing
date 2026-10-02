import { FeatureTags } from '../../../../services/types';

export type CombinedTags = {
  /** Keys that have the identical value on every selected item. */
  shared: FeatureTags;
  /**
   * Keys that are not identical across the selection. A missing key counts as
   * a different value, same as in the iD editor. The array lists the distinct
   * non-empty values so the UI can show what would be overwritten.
   */
  mixed: Record<string, string[]>;
  /** Union of keys, in the order they first appear. */
  keys: string[];
};

export const combineTags = (tagSets: FeatureTags[]): CombinedTags => {
  const keys: string[] = [];
  const seen = new Set<string>();
  tagSets.forEach((tags) => {
    Object.keys(tags).forEach((key) => {
      if (seen.has(key)) return;
      seen.add(key);
      keys.push(key);
    });
  });

  const shared: FeatureTags = {};
  const mixed: Record<string, string[]> = {};
  if (tagSets.length === 0) return { shared, mixed, keys };

  keys.forEach((key) => {
    const values = tagSets.map((tags) => tags[key]);
    const first = values[0];
    const allSame = values.every((value) => value === first);
    if (allSame && first !== undefined) {
      shared[key] = first;
      return;
    }
    const unique: string[] = [];
    values.forEach((value) => {
      if (value && !unique.includes(value)) unique.push(value);
    });
    mixed[key] = unique;
  });

  return { shared, mixed, keys };
};

export const isMixedKey = (combined: CombinedTags, key: string) =>
  Object.prototype.hasOwnProperty.call(combined.mixed, key);

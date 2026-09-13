import { Preset } from '../../../../../../services/tagging/types/Presets';
import { TagsEntries } from '../../../context/types';

/**
 * Computes the new tag entries when the user changes the preset (type) of a
 * feature. Tags coming from the new preset are added, tags coming from the old
 * preset are removed. Any existing tag whose key is (re)added by the new preset
 * is dropped from the previous entries so it is not duplicated. See #218.
 */
export const getTagsEntriesForPreset = (
  prev: TagsEntries,
  oldPreset: Preset | undefined,
  newPreset: Preset | undefined,
): TagsEntries => {
  const toRemove = oldPreset ? (oldPreset.addTags ?? oldPreset.tags ?? {}) : {};

  const toAdd = newPreset
    ? Object.entries(newPreset.addTags ?? newPreset.tags ?? {})
    : [];
  const toAddKeys = new Set(toAdd.map(([key]) => key));

  return [
    ...toAdd,
    ...prev.filter(
      ([key, value]) =>
        !toAddKeys.has(key) && !(toRemove[key] && toRemove[key] === value),
    ),
  ];
};

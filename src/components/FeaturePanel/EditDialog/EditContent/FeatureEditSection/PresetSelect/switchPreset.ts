import { allPresets } from '../../../../../../services/tagging/data';
import { Preset } from '../../../../../../services/tagging/types/Presets';
import { TagsEntries } from '../../../context/types';

// Replaces the tags of the old preset with the ones of the new preset and
// keeps everything else (name, description, …).
export const switchPresetTags = (
  entries: TagsEntries,
  oldPresetKey: string,
  newPreset: Preset | undefined,
): TagsEntries => {
  const oldPreset = allPresets[oldPresetKey];
  const toRemove = oldPreset ? (oldPreset.addTags ?? oldPreset.tags ?? {}) : {};

  const toAdd = newPreset
    ? Object.entries(newPreset.addTags ?? newPreset.tags ?? {})
    : [];

  return [
    ...toAdd,
    ...entries.filter(
      ([key, value]) => !(toRemove[key] && toRemove[key] === value),
    ),
  ];
};

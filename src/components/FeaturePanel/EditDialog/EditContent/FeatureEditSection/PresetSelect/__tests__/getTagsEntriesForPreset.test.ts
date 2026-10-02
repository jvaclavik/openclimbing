import { getTagsEntriesForPreset } from '../getTagsEntriesForPreset';
import { Preset } from '../../../../../../../services/tagging/types/Presets';

const preset = (partial: Partial<Preset>): Preset =>
  ({ presetKey: 'test', ...partial }) as Preset;

describe('getTagsEntriesForPreset', () => {
  it('does not duplicate a tag re-added by the new preset (#218)', () => {
    const prev: [string, string][] = [
      ['sport', 'climbing'],
      ['url', 'http://example.com'],
    ];
    const oldPreset = preset({ tags: { sport: 'climbing' } });
    const newPreset = preset({
      tags: { sport: 'climbing', 'climbing:crag': 'yes' },
    });

    const result = getTagsEntriesForPreset(prev, oldPreset, newPreset);

    expect(result).toEqual([
      ['sport', 'climbing'],
      ['climbing:crag', 'yes'],
      ['url', 'http://example.com'],
    ]);
  });

  it('removes old preset tags and adds new preset tags', () => {
    const prev: [string, string][] = [
      ['amenity', 'cafe'],
      ['name', 'Foo'],
    ];
    const oldPreset = preset({ tags: { amenity: 'cafe' } });
    const newPreset = preset({ tags: { amenity: 'restaurant' } });

    const result = getTagsEntriesForPreset(prev, oldPreset, newPreset);

    expect(result).toEqual([
      ['amenity', 'restaurant'],
      ['name', 'Foo'],
    ]);
  });

  it('prefers addTags over tags for both removal and addition', () => {
    const prev: [string, string][] = [['climbing', 'route_bottom']];
    const oldPreset = preset({
      tags: { climbing: 'route_bottom' },
      addTags: { climbing: 'route_bottom' },
    });
    const newPreset = preset({
      tags: { climbing: 'crag' },
      addTags: { sport: 'climbing', 'climbing:crag': 'yes' },
    });

    const result = getTagsEntriesForPreset(prev, oldPreset, newPreset);

    expect(result).toEqual([
      ['sport', 'climbing'],
      ['climbing:crag', 'yes'],
    ]);
  });

  it('uses removeTags over addTags/tags for removal', () => {
    const prev: [string, string][] = [
      ['sport', 'climbing'],
      ['foo', 'bar'],
      ['name', 'Crag'],
    ];
    const oldPreset = preset({
      tags: { sport: 'climbing' },
      addTags: { sport: 'climbing' },
      removeTags: { foo: 'bar' },
    });
    const newPreset = preset({ tags: { climbing: 'crag' } });

    const result = getTagsEntriesForPreset(prev, oldPreset, newPreset);

    expect(result).toEqual([
      ['climbing', 'crag'],
      ['sport', 'climbing'],
      ['name', 'Crag'],
    ]);
  });

  it('keeps existing tags when there is no old or new preset', () => {
    const prev: [string, string][] = [['sport', 'climbing']];

    expect(getTagsEntriesForPreset(prev, undefined, undefined)).toEqual(prev);
  });
});

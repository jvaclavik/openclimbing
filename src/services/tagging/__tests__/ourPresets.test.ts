import { findPreset } from '../presets';

// the iD tagging schema has no via ferrata preset, we add our own in modifyPresets()
describe('via ferrata presets', () => {
  it('matches a highway=via_ferrata way', () => {
    const preset = findPreset('way', {
      highway: 'via_ferrata',
      via_ferrata_scale: '3',
    });

    expect(preset.presetKey).toBe('climbing/via_ferrata');
  });

  it('matches a sport=via_ferrata node', () => {
    const preset = findPreset('node', { sport: 'via_ferrata' });

    expect(preset.presetKey).toBe('climbing/via_ferrata_start');
    expect(preset.addTags).toEqual({
      sport: 'via_ferrata',
      via_ferrata: 'start',
    });
  });
});

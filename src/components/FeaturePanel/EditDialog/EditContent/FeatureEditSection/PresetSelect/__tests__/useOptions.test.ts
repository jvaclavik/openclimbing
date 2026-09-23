import { allPresets } from '../../../../../../../services/tagging/data';
import { getEmptyOptions, TranslatedPreset } from '../useOptions';

jest.mock('../../../../../../../services/project', () => ({
  PROJECT_ID: 'openclimbing',
}));

const options = Object.values(allPresets).map((preset) => ({
  ...preset,
  name: preset.presetKey,
})) as TranslatedPreset[];

const getPresetKeys = (osmType: 'node' | 'way') =>
  getEmptyOptions(options, osmType).map(({ presetKey }) => presetKey);

describe('getEmptyOptions', () => {
  it('offers climbing presets incl. climbing gym for a node', () => {
    expect(getPresetKeys('node')).toEqual([
      'type/site/climbing/area',
      'climbing/crag',
      'leisure/sports_centre/climbing',
      'climbing/route_bottom',
    ]);
  });

  it('offers climbing presets incl. climbing gym for a way', () => {
    expect(getPresetKeys('way')).toEqual([
      'climbing/crag',
      'leisure/sports_centre/climbing',
      'climbing/route',
    ]);
  });
});

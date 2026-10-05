import { gradeColors } from '../gradeData';
import {
  getDifficulty,
  getDifficultyColor,
  getGradeIndexFromTags,
  getGradeSystemFromOsmTag,
  getOsmTagFromGradeSystem,
} from '../routeGrade';
import { migrateUserSettings } from '../../../../components/utils/userSettings/getGradeSystem';

describe('Fontainebleau grade key climbing:grade:font', () => {
  it('reads the current OSM tag and the legacy fb tag as the same system', () => {
    expect(getOsmTagFromGradeSystem('font')).toBe('climbing:grade:font');
    expect(getGradeSystemFromOsmTag('climbing:grade:font')).toBe('font');
    expect(getGradeSystemFromOsmTag('climbing:grade:fb')).toBe('font');

    const fromFont = getDifficulty({ 'climbing:grade:font': '7A' });
    const fromFb = getDifficulty({ 'climbing:grade:fb': '7A' });

    expect(fromFont).toEqual({ gradeSystem: 'font', grade: '7A' });
    expect(fromFb).toEqual({ gradeSystem: 'font', grade: '7A' });
    expect(getGradeIndexFromTags({ 'climbing:grade:font': '7A' })).toBe(
      getGradeIndexFromTags({ 'climbing:grade:fb': '7A' }),
    );
  });

  it('colors a Fontainebleau grade from either tag', () => {
    const expected = gradeColors['10-'].light;
    expect(
      getDifficultyColor({ gradeSystem: 'font', grade: '7A' }, 'light'),
    ).toBe(expected);
    expect(
      getDifficultyColor(getDifficulty({ 'climbing:grade:fb': '7A' }), 'light'),
    ).toBe(expected);
  });

  it('migrates a saved fb grade system to font', () => {
    const migrated = migrateUserSettings({
      'climbing.gradeSystem': 'fb',
      'climbing.visibleGradeSystems': { uiaa: true, fb: true, french: false },
    } as never);

    expect(migrated['climbing.gradeSystem']).toBe('font');
    expect(migrated['climbing.visibleGradeSystems']).toEqual({
      uiaa: true,
      french: false,
      font: true,
    });
    expect(migrateUserSettings(migrated)).toBe(migrated);
  });
});

import { GRADE_TABLE } from '../gradeData';
import { convertGrade } from '../routeGrade';

describe('French grade scale grade 3 subdivisions', () => {
  it('uses letters 3a/3b/3c for the lower grades', () => {
    expect(GRADE_TABLE.french).toContain('3a');
    expect(GRADE_TABLE.french).toContain('3b');
    expect(GRADE_TABLE.french).toContain('3c');
    expect(GRADE_TABLE.french).not.toContain('3-');
    expect(GRADE_TABLE.french).not.toContain('3+');
  });

  it('converts UIAA grade 3 into the French letter subdivisions', () => {
    expect(convertGrade('uiaa', 'french', '3-')).toBe('3a');
    expect(convertGrade('uiaa', 'french', '3')).toBe('3b');
    expect(convertGrade('uiaa', 'french', '3+')).toBe('3c');
  });

  it('converts the French letter subdivisions back to UIAA', () => {
    expect(convertGrade('french', 'uiaa', '3a')).toBe('3-');
    expect(convertGrade('french', 'uiaa', '3b')).toBe('3');
    expect(convertGrade('french', 'uiaa', '3c')).toBe('3+');
  });
});

import { ALL_FERRATA_GRADES, matchesFerrataGrade } from '../ferrataGradeFilter';

describe('Klettersteig grade filter', () => {
  it('shows all entries by default, including missing grades', () => {
    expect(matchesFerrataGrade('6', ALL_FERRATA_GRADES)).toBe(true);
    expect(matchesFerrataGrade(null, ALL_FERRATA_GRADES)).toBe(true);
  });

  it('matches either side of a split grade and intermediate range grades', () => {
    expect(matchesFerrataGrade('B/C', ['B'])).toBe(true);
    expect(matchesFerrataGrade('B/C', ['C'])).toBe(true);
    expect(matchesFerrataGrade('B/C', ['D'])).toBe(false);
    expect(matchesFerrataGrade('2+–4', ['C'])).toBe(true);
  });

  it.each([null, '', '0', '7', '2;3', 'PD'])(
    'keeps %s in the unknown group',
    (value) => {
      expect(matchesFerrataGrade(value, ['unknown'])).toBe(true);
      expect(matchesFerrataGrade(value, ['A', 'B', 'C', 'D', 'E', 'F'])).toBe(
        false,
      );
    },
  );
});

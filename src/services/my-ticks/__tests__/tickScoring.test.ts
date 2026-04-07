import {
  computeTickPointsForLeaderboard,
  computeTickScore,
  findGradeRowIndex,
} from '../tickScoring';
import { ClimbingTick } from '../../../types';

describe('tickScoring', () => {
  test('findGradeRowIndex resolves French grade', () => {
    const idx = findGradeRowIndex('french', '6a');
    expect(idx).not.toBeNull();
    expect(idx).toBeGreaterThan(0);
  });

  test('PJ yields zero points', () => {
    const tick = {
      id: 1,
      osmUserId: 1,
      shortId: 'w1',
      timestamp: '2020-01-01',
      style: 'PJ',
      myGrade: null,
      note: null,
      pairing: null,
    } as ClimbingTick;
    const s = computeTickScore(
      { 'climbing:grade:french': '8a' },
      tick,
      'french',
    );
    expect(s.points).toBe(0);
  });

  test('computeTickPointsForLeaderboard matches row-based score for French 6a RP', () => {
    const fromLeaderboard = computeTickPointsForLeaderboard({
      style: 'RP',
      routeGradeTxt: '6a',
      myGrade: null,
    });
    const tick = {
      id: 1,
      osmUserId: 1,
      shortId: 'w1',
      timestamp: '2020-01-01',
      style: 'RP',
      myGrade: null,
      note: null,
      pairing: null,
    } as import('../../../types').ClimbingTick;
    const fromFull = computeTickScore(
      { 'climbing:grade:french': '6a' },
      tick,
      'french',
    );
    expect(fromLeaderboard).toBe(fromFull.points);
  });

  test('RP has multiplier 1', () => {
    const tick = {
      id: 1,
      osmUserId: 1,
      shortId: 'w1',
      timestamp: '2020-01-01',
      style: 'RP',
      myGrade: null,
      note: null,
      pairing: null,
    } as ClimbingTick;
    const s = computeTickScore(
      { 'climbing:grade:french': '6a' },
      tick,
      'french',
    );
    expect(s.multiplier).toBe(1);
    expect(s.gradeRowIndex).not.toBeNull();
    expect(s.points).toBe(Math.round(s.gradeBase * 1));
  });
});

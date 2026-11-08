import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { isGroupedByDay, sortTicks } from '../ticksSort';

const row = (id: number, date: string, grade: number | null, points = 0) =>
  ({
    date,
    name: `r${id}`,
    tick: { id },
    tickScore: { gradeRowIndex: grade, points },
  }) as unknown as FetchedClimbingTick;

const rows = [
  row(1, '2025-01-01T10:00:00Z', 30, 10),
  row(2, '2025-03-01T10:00:00Z', 5, 50),
  row(3, '2025-02-01T10:00:00Z', null, 20),
];
const ids = (r: FetchedClimbingTick[]) => r.map((x) => x.tick.id);

describe('sortTicks', () => {
  it('sorts by date both ways without mutating input', () => {
    expect(ids(sortTicks(rows, 'date_desc'))).toEqual([2, 3, 1]);
    expect(ids(sortTicks(rows, 'date_asc'))).toEqual([1, 3, 2]);
    expect(ids(rows)).toEqual([1, 2, 3]);
  });

  it('sorts grades by table index with unknown last', () => {
    expect(ids(sortTicks(rows, 'grade_desc'))).toEqual([1, 2, 3]);
  });

  it('sorts by points and name', () => {
    expect(ids(sortTicks(rows, 'points_desc'))).toEqual([2, 3, 1]);
    expect(ids(sortTicks(rows, 'name_asc'))).toEqual([1, 2, 3]);
  });

  it('groups only date orders', () => {
    expect(isGroupedByDay('date_desc')).toBe(true);
    expect(isGroupedByDay('grade_desc')).toBe(false);
  });
});

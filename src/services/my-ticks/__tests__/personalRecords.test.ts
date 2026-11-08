import { FetchedClimbingTick } from '../getMyTicks';
import { computeMilestones, computePersonalRecords } from '../personalRecords';

let nextId = 1;
const row = (
  date: string,
  style: string | null,
  gradeRowIndex: number | null,
  extra: { grade?: string; points?: number; crag?: string | null } = {},
) =>
  ({
    date,
    style,
    grade: extra.grade ?? (gradeRowIndex == null ? '?' : `g${gradeRowIndex}`),
    cragName: extra.crag === undefined ? 'Crag A' : extra.crag,
    name: `route ${nextId}`,
    tick: { id: nextId++ },
    tickScore: {
      points: extra.points ?? 10,
      gradeRowIndex,
      gradeBase: 0,
      multiplier: 1,
    },
  }) as unknown as FetchedClimbingTick;

beforeEach(() => {
  nextId = 1;
});

describe('computePersonalRecords', () => {
  it('finds hardest sends per style, earliest wins ties, projects ignored', () => {
    const rows = [
      row('2024-05-02T10:00:00Z', 'RP', 20),
      row('2024-05-01T10:00:00Z', 'RP', 20), // earlier same grade
      row('2024-06-01T10:00:00Z', 'OS', 15),
      row('2024-06-02T10:00:00Z', 'FL', 18),
      row('2024-07-01T10:00:00Z', 'PJ', 30),
      row('2024-07-02T10:00:00Z', 'TR', null),
    ];
    const r = computePersonalRecords(rows);
    expect(r.hardestSend?.gradeRowIndex).toBe(20);
    expect(r.hardestSend?.row.date).toBe('2024-05-01T10:00:00Z');
    expect(r.hardestOnsight?.gradeRowIndex).toBe(15);
    expect(r.hardestFlash?.gradeRowIndex).toBe(18);
    expect(r.hardestRedpoint?.gradeRowIndex).toBe(20);
    expect(r.sendCount).toBe(5);
    expect(r.climbingDays).toBe(6);
  });

  it('computes best days and top crag', () => {
    const rows = [
      row('2024-05-01T10:00:00Z', 'RP', 10, { points: 50 }),
      row('2024-05-01T11:00:00Z', 'RP', 10, { points: 50 }),
      row('2024-05-02T10:00:00Z', 'OS', 10, { points: 120, crag: 'Crag B' }),
      row('2024-05-03T10:00:00Z', 'RP', 10, { points: 5, crag: 'Crag B' }),
      row('2024-05-04T10:00:00Z', 'RP', 10, { points: 5, crag: 'Crag B' }),
    ];
    const r = computePersonalRecords(rows);
    expect(r.bestDayByPoints).toEqual({
      day: '2024-05-02',
      points: 120,
      tickCount: 1,
    });
    expect(r.bestDayByTicks?.day).toBe('2024-05-01');
    expect(r.topCrag).toEqual({ name: 'Crag B', days: 3 });
    expect(r.bestYear).toEqual({
      year: 2024,
      points: 230,
      sendCount: 5,
      days: 4,
    });
    expect(r.cragCount).toBe(2);
  });

  it('keeps crags with the same name apart', () => {
    const withId = (date: string, id: number) =>
      ({
        ...row(date, 'RP', 5, { crag: 'Velká stěna' }),
        cragOsmType: 'relation',
        cragOsmId: id,
      }) as unknown as FetchedClimbingTick;
    const r = computePersonalRecords([
      withId('2024-05-01T10:00:00Z', 1),
      withId('2024-05-02T10:00:00Z', 2),
    ]);
    expect(r.cragCount).toBe(2);
    expect(r.topCrag).toEqual({ name: 'Velká stěna', days: 1 });
  });

  it('handles empty input', () => {
    const r = computePersonalRecords([]);
    expect(r.hardestSend).toBeNull();
    expect(r.bestDayByPoints).toBeNull();
    expect(r.topCrag).toBeNull();
  });
});

describe('computeMilestones', () => {
  it('emits first send, grade PBs and count milestones newest first', () => {
    const rows = [
      row('2024-01-01T10:00:00Z', 'RP', 10),
      row('2024-01-02T10:00:00Z', 'RP', 9),
      row('2024-01-03T10:00:00Z', 'OS', 12),
      row('2024-01-04T10:00:00Z', 'PJ', 30), // project: no PB
      ...Array.from({ length: 7 }, (_, i) =>
        row(`2024-02-${String(i + 1).padStart(2, '0')}T10:00:00Z`, 'RP', 5),
      ),
    ];
    const milestones = computeMilestones(rows);
    const kinds = milestones.map((m) =>
      'count' in m ? `${m.kind}:${m.count}` : m.kind,
    );
    expect(kinds).toEqual([
      'send_count:10',
      'climbing_days:10',
      'grade_pb',
      'first_send',
    ]);
    const pb = milestones.find((m) => m.kind === 'grade_pb');
    expect(pb).toMatchObject({ day: '2024-01-03', grade: 'g12', style: 'OS' });
  });

  it('emits crag count milestones', () => {
    const rows = ['A', 'B', 'C', 'D', 'E'].map((crag, i) =>
      row(`2024-03-0${i + 1}T10:00:00Z`, 'RP', 5, { crag }),
    );
    const crag = computeMilestones(rows).find((m) => m.kind === 'crag_count');
    expect(crag).toEqual({
      kind: 'crag_count',
      day: '2024-03-05',
      count: 5,
      cragName: 'E',
    });
  });
});

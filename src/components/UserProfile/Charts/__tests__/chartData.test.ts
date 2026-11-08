import { FetchedClimbingTick } from '../../../../services/my-ticks/getMyTicks';
import {
  chartMonthKeys,
  gradeProgression,
  gradePyramid,
  sendsByMonth,
  styleSplit,
  topCrags,
} from '../chartData';

let id = 0;
const row = (
  date: string,
  style: string,
  gradeIndex: number | null,
  crag = 'A',
) => {
  id += 1;
  return {
    date,
    style,
    grade: gradeIndex == null ? '?' : `g${gradeIndex}`,
    name: `r${id}`,
    cragName: crag,
    tick: { id },
    tickScore: { gradeRowIndex: gradeIndex, points: 10 },
  } as unknown as FetchedClimbingTick;
};

const rows = [
  row('2024-01-05T10:00:00Z', 'OS', 10),
  row('2024-01-20T10:00:00Z', 'RP', 14),
  row('2024-03-02T10:00:00Z', 'FL', 12, 'B'),
  row('2024-03-02T11:00:00Z', 'PJ', 20, 'B'),
  row('2024-03-03T10:00:00Z', 'TR', null, 'B'),
];

describe('chart data', () => {
  it('spans the whole history for "all"', () => {
    expect(chartMonthKeys({ mode: 'all' }, rows)).toEqual([
      '2024-01',
      '2024-02',
      '2024-03',
    ]);
  });

  it('takes the hardest send per month, ignoring projects', () => {
    const p = gradeProgression(rows, ['2024-01', '2024-02', '2024-03']);
    expect(p.map((x) => x.gradeIndex)).toEqual([14, null, 12]);
    expect(p[0].route).toBe('r2');
  });

  it('builds the pyramid hardest first with style buckets', () => {
    expect(gradePyramid(rows)).toEqual([
      {
        grade: 'g14',
        gradeIndex: 14,
        total: 1,
        counts: { os: 0, fl: 0, rp: 1, other: 0 },
      },
      {
        grade: 'g12',
        gradeIndex: 12,
        total: 1,
        counts: { os: 0, fl: 1, rp: 0, other: 0 },
      },
      {
        grade: 'g10',
        gradeIndex: 10,
        total: 1,
        counts: { os: 1, fl: 0, rp: 0, other: 0 },
      },
    ]);
  });

  it('counts sends per month, style split and crag days', () => {
    expect(sendsByMonth(rows, ['2024-01', '2024-03'])).toEqual([
      { key: '2024-01', sends: 2 },
      { key: '2024-03', sends: 2 },
    ]);
    expect(styleSplit(rows)).toEqual({
      counts: { os: 1, fl: 1, rp: 1, other: 1 },
      projects: 1,
    });
    expect(topCrags(rows)).toEqual([
      { name: 'A', days: 2 },
      { name: 'B', days: 2 },
    ]);
  });
});

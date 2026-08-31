import {
  NO_STYLE_KEY,
  ascentsByYear,
  careerMonthKeys,
  cumulativeSeries,
  progressionSeries,
} from '../userProfileCareerAggregates';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';

type TickInput = {
  date: string;
  style?: string | null;
  rowIndex?: number | null;
  points?: number;
};

const tick = ({
  date,
  style = 'RP',
  rowIndex = 10,
  points = 20,
}: TickInput): FetchedClimbingTick =>
  ({
    key: `${date}-${style}`,
    date,
    style,
    tickScore: { points, gradeRowIndex: rowIndex, gradeBase: 0, multiplier: 1 },
  }) as unknown as FetchedClimbingTick;

describe('ascentsByYear', () => {
  test('splits counts by style and fills gap years', () => {
    const rows = ascentsByYear([
      tick({ date: '2020-03-01', style: 'OS' }),
      tick({ date: '2020-05-01', style: 'RP' }),
      tick({ date: '2022-05-01', style: 'RP' }),
    ]);
    expect(rows.map((r) => r.year)).toEqual(['2020', '2021', '2022']);
    expect(rows[0]).toMatchObject({ year: '2020', total: 2, OS: 1, RP: 1 });
    expect(rows[1]).toMatchObject({ year: '2021', total: 0 });
    expect(rows[2]).toMatchObject({ year: '2022', total: 1, RP: 1 });
  });

  test('unknown style falls back to the no-style key', () => {
    const rows = ascentsByYear([tick({ date: '2020-03-01', style: 'XX' })]);
    expect(rows[0][NO_STYLE_KEY]).toBe(1);
  });

  test('ignores ticks with an unparsable date', () => {
    expect(ascentsByYear([tick({ date: 'nonsense' })])).toEqual([]);
  });
});

describe('careerMonthKeys', () => {
  test('spans first to last tick month inclusive', () => {
    const keys = careerMonthKeys([
      tick({ date: '2023-11-20' }),
      tick({ date: '2024-02-02' }),
    ]);
    expect(keys).toEqual(['2023-11', '2023-12', '2024-01', '2024-02']);
  });

  test('returns nothing without usable dates', () => {
    expect(careerMonthKeys([])).toEqual([]);
  });
});

describe('progressionSeries', () => {
  test('best and top average use a trailing window and drop out of it', () => {
    const ticks = [
      tick({ date: '2024-01-10', rowIndex: 20 }),
      tick({ date: '2024-01-20', rowIndex: 10 }),
    ];
    const keys = ['2024-01', '2024-06', '2025-02'];
    const rows = progressionSeries(ticks, keys, { windowMonths: 12, topN: 2 });
    expect(rows[0]).toEqual({ key: '2024-01', best: 20, topAvg: 15 });
    expect(rows[1]).toEqual({ key: '2024-06', best: 20, topAvg: 15 });
    // 2024-01 is 13 months back, so the window is empty again
    expect(rows[2]).toEqual({ key: '2025-02', best: null, topAvg: null });
  });

  test('projects and ticks without a grade are excluded', () => {
    const rows = progressionSeries(
      [
        tick({ date: '2024-01-10', style: 'PJ', rowIndex: 40 }),
        tick({ date: '2024-01-11', rowIndex: null }),
      ],
      ['2024-01'],
    );
    expect(rows[0]).toEqual({ key: '2024-01', best: null, topAvg: null });
  });
});

describe('cumulativeSeries', () => {
  test('accumulates ascents and points across months', () => {
    const rows = cumulativeSeries(
      [
        tick({ date: '2024-01-10', points: 20 }),
        tick({ date: '2024-03-10', points: 30 }),
      ],
      ['2024-01', '2024-02', '2024-03'],
    );
    expect(rows).toEqual([
      { key: '2024-01', ascents: 1, points: 20 },
      { key: '2024-02', ascents: 1, points: 20 },
      { key: '2024-03', ascents: 2, points: 50 },
    ]);
  });

  test('projects do not count as ascents', () => {
    const rows = cumulativeSeries(
      [tick({ date: '2024-01-10', style: 'PJ', points: 0 })],
      ['2024-01'],
    );
    expect(rows[0]).toEqual({ key: '2024-01', ascents: 0, points: 0 });
  });
});

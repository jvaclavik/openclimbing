import { useMemo } from 'react';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { t } from '../../services/intl';
import {
  cragVisitDays,
  aggregateMonthlyPointsForKeys,
  bestSendByMonth,
  gradeSendCountsByStyle,
  tickStylePieData,
  weekdayRadarData,
  sendCountExclProjects,
  totalTickPoints,
} from './userProfilePerformanceAggregates';
import {
  filterFetchedTicksByRange,
  getChartMonthKeys,
  getYearsPresentInTicks,
  type ClimbingStatsDateRange,
} from '../../services/my-ticks/climbingStatsDateRange';

function useYears(fetchedTicks: FetchedClimbingTick[]) {
  return useMemo(() => getYearsPresentInTicks(fetchedTicks), [fetchedTicks]);
}

function useFilteredTicks(
  fetchedTicks: FetchedClimbingTick[],
  range: ClimbingStatsDateRange,
) {
  return useMemo(
    () => filterFetchedTicksByRange(fetchedTicks, range),
    [fetchedTicks, range],
  );
}

function useMonthKeys(
  range: ClimbingStatsDateRange,
  allTicksUnfiltered: FetchedClimbingTick[],
) {
  return useMemo(
    () => getChartMonthKeys(range, allTicksUnfiltered),
    [range, allTicksUnfiltered],
  );
}

function useMonthlyPoints(
  filteredTicks: FetchedClimbingTick[],
  monthKeys: string[],
) {
  const monthlySeries = useMemo(
    () => aggregateMonthlyPointsForKeys(filteredTicks, monthKeys),
    [filteredTicks, monthKeys],
  );
  const maxMonthly = useMemo(
    () => Math.max(1, ...monthlySeries.map((m) => m.points)),
    [monthlySeries],
  );
  return { monthlySeries, maxMonthly };
}

function useStats(filteredTicks: FetchedClimbingTick[]) {
  const totalPoints = useMemo(
    () => totalTickPoints(filteredTicks),
    [filteredTicks],
  );
  const tickCount = useMemo(() => filteredTicks.length, [filteredTicks]);
  const sendCount = useMemo(
    () => sendCountExclProjects(filteredTicks),
    [filteredTicks],
  );
  return { totalPoints, tickCount, sendCount };
}

function useBestSend(
  filteredTicks: FetchedClimbingTick[],
  monthKeys: string[],
) {
  const bestSendSeries = useMemo(
    () => bestSendByMonth(filteredTicks, monthKeys),
    [filteredTicks, monthKeys],
  );
  const maxBestRow = useMemo(
    () => Math.max(0, ...bestSendSeries.map((b) => b.rowIndex)),
    [bestSendSeries],
  );
  return { bestSendSeries, maxBestRow };
}

function useCragDays(filteredTicks: FetchedClimbingTick[]) {
  const unknownCrag = t('user_profile.area_unknown');
  const areaSeries = useMemo(
    () => cragVisitDays(filteredTicks, unknownCrag).slice(0, 12),
    [filteredTicks, unknownCrag],
  );
  const maxAreaDays = useMemo(
    () => Math.max(1, ...areaSeries.map((a) => a.days)),
    [areaSeries],
  );
  return { areaSeries, maxAreaDays };
}

function useGradeDistribution(filteredTicks: FetchedClimbingTick[]) {
  const gradeSeries = useMemo(
    () => gradeSendCountsByStyle(filteredTicks).slice(0, 20),
    [filteredTicks],
  );
  const maxGradeCount = useMemo(
    () => Math.max(1, ...gradeSeries.map((g) => g.total)),
    [gradeSeries],
  );
  return { gradeSeries, maxGradeCount };
}

function useStylePie(filteredTicks: FetchedClimbingTick[]) {
  return useMemo(() => tickStylePieData(filteredTicks), [filteredTicks]);
}

function useWeekdayRadar(filteredTicks: FetchedClimbingTick[]) {
  return useMemo(() => weekdayRadarData(filteredTicks), [filteredTicks]);
}

export function useUserProfilePerformanceDerived(
  fetchedTicks: FetchedClimbingTick[],
  range: ClimbingStatsDateRange,
) {
  const years = useYears(fetchedTicks);
  const filteredTicks = useFilteredTicks(fetchedTicks, range);
  const monthKeys = useMonthKeys(range, fetchedTicks);
  const { monthlySeries, maxMonthly } = useMonthlyPoints(
    filteredTicks,
    monthKeys,
  );
  const { totalPoints, tickCount, sendCount } = useStats(filteredTicks);
  const { bestSendSeries, maxBestRow } = useBestSend(filteredTicks, monthKeys);
  const { areaSeries, maxAreaDays } = useCragDays(filteredTicks);
  const { gradeSeries, maxGradeCount } = useGradeDistribution(filteredTicks);
  const stylePie = useStylePie(filteredTicks);
  const weekdayRadar = useWeekdayRadar(filteredTicks);

  return {
    years,
    monthlySeries,
    maxMonthly,
    totalPoints,
    tickCount,
    sendCount,
    bestSendSeries,
    maxBestRow,
    areaSeries,
    maxAreaDays,
    gradeSeries,
    maxGradeCount,
    stylePie,
    weekdayRadar,
  };
}

import { useMemo } from 'react';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { t } from '../../services/intl';
import {
  areaVisitDays,
  aggregateMonthlyPointsForKeys,
  bestSendByMonth,
  cumulativePointsSeries,
  gradeSendCountsByStyle,
  sendCountExclProjects,
  totalTickPoints,
} from './userProfilePerformanceAggregates';
import {
  filterFetchedTicksByRange,
  getChartMonthKeys,
  getYearsPresentInTicks,
  type ClimbingStatsDateRange,
} from '../../services/my-ticks/climbingStatsDateRange';

export function useUserProfilePerformanceDerived(
  fetchedTicks: FetchedClimbingTick[],
  range: ClimbingStatsDateRange,
) {
  const years = useMemo(
    () => getYearsPresentInTicks(fetchedTicks),
    [fetchedTicks],
  );

  const filteredTicks = useMemo(
    () => filterFetchedTicksByRange(fetchedTicks, range),
    [fetchedTicks, range],
  );

  const monthKeys = useMemo(
    () => getChartMonthKeys(range, fetchedTicks),
    [range, fetchedTicks],
  );

  const monthlySeries = useMemo(
    () => aggregateMonthlyPointsForKeys(filteredTicks, monthKeys),
    [filteredTicks, monthKeys],
  );

  const maxMonthly = useMemo(
    () => Math.max(1, ...monthlySeries.map((m) => m.points)),
    [monthlySeries],
  );

  const cumulative = useMemo(
    () => cumulativePointsSeries(filteredTicks),
    [filteredTicks],
  );

  const maxCumulative = cumulative.length
    ? cumulative[cumulative.length - 1].total
    : 0;

  const totalPoints = useMemo(
    () => totalTickPoints(filteredTicks),
    [filteredTicks],
  );

  const sendCount = useMemo(
    () => sendCountExclProjects(filteredTicks),
    [filteredTicks],
  );

  const bestSendSeries = useMemo(
    () => bestSendByMonth(filteredTicks, monthKeys),
    [filteredTicks, monthKeys],
  );

  const maxBestRow = useMemo(
    () => Math.max(0, ...bestSendSeries.map((b) => b.rowIndex)),
    [bestSendSeries],
  );

  const unknownArea = t('user_profile.area_unknown');

  const areaSeries = useMemo(
    () => areaVisitDays(filteredTicks, unknownArea).slice(0, 12),
    [filteredTicks, unknownArea],
  );

  const maxAreaDays = useMemo(
    () => Math.max(1, ...areaSeries.map((a) => a.days)),
    [areaSeries],
  );

  const gradeSeries = useMemo(
    () => gradeSendCountsByStyle(filteredTicks).slice(0, 20),
    [filteredTicks],
  );

  const maxGradeCount = useMemo(
    () => Math.max(1, ...gradeSeries.map((g) => g.total)),
    [gradeSeries],
  );

  return {
    years,
    monthlySeries,
    maxMonthly,
    cumulative,
    maxCumulative,
    totalPoints,
    sendCount,
    bestSendSeries,
    maxBestRow,
    areaSeries,
    maxAreaDays,
    gradeSeries,
    maxGradeCount,
  };
}

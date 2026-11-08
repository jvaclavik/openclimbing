import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';

export function totalTickPoints(ticks: FetchedClimbingTick[]): number {
  return ticks.reduce((s, r) => s + r.tickScore.points, 0);
}

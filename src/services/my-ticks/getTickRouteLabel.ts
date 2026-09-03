import { ClimbingTick } from '../../types';
import { t } from '../intl';

export function getTickRouteLabel(
  tick: ClimbingTick,
  fallbackName?: string | null,
): string {
  const fromTick = tick.routeName?.trim();
  if (fromTick) {
    return fromTick;
  }
  const fromFallback = fallbackName?.trim();
  if (fromFallback) {
    return fromFallback;
  }
  return t('my_ticks.route_unnamed');
}

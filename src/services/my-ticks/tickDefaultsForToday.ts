import {
  TickDefaults,
  UserSettingsType,
} from '../../components/utils/userSettings/UserSettingsContext';
import { todayDateInputMax } from './tickTimestampInput';

export function getTickDefaultsForToday(
  userSettings: UserSettingsType,
): TickDefaults | null {
  if (!userSettings['climbing.rememberTickDefaults']) {
    return null;
  }
  const defaults = userSettings['climbing.tickDefaults'];
  if (!defaults?.savedOn || defaults.savedOn !== todayDateInputMax()) {
    return null;
  }
  return defaults;
}

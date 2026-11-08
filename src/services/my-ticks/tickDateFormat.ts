import { isValid, parseISO } from 'date-fns';
import { intl, t } from '../intl';

const parse = (value: string): Date | null => {
  if (!value) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`) // calendar day, avoid UTC shift
    : parseISO(value);
  return isValid(parsed) ? parsed : null;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Compact day label: "Dnes", "Včera", "7.6." (this year) or "7.6.2024".
 * Accepts `YYYY-MM-DD` or an ISO timestamp.
 */
export const formatShortTickDate = (
  value: string,
  now: Date = new Date(),
): string => {
  const date = parse(value);
  if (!date) return value ?? '';
  if (dayKey(date) === dayKey(now)) return t('date.today');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(date) === dayKey(yesterday)) return t('date.yesterday');
  const dm = `${date.getDate()}.${date.getMonth() + 1}.`;
  return date.getFullYear() === now.getFullYear()
    ? dm
    : `${dm}${date.getFullYear()}`;
};

/** Full date for tooltips, e.g. "sobota 7. 6. 2025". */
export const formatFullTickDate = (value: string): string => {
  const date = parse(value);
  if (!date) return value ?? '';
  try {
    return new Intl.DateTimeFormat(intl.lang || 'en', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toDateString();
  }
};

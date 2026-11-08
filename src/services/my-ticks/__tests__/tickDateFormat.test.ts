import { intl } from '../../intl';
import { formatShortTickDate } from '../tickDateFormat';

beforeAll(() => {
  intl.messages = {
    ...intl.messages,
    'date.today': 'Today',
    'date.yesterday': 'Yesterday',
  };
});

const now = new Date('2026-06-08T15:00:00');

describe('formatShortTickDate', () => {
  it('names today and yesterday', () => {
    expect(formatShortTickDate('2026-06-08', now)).toBe('Today');
    expect(formatShortTickDate('2026-06-07T09:00:00', now)).toBe('Yesterday');
  });

  it('omits the current year', () => {
    expect(formatShortTickDate('2026-03-01', now)).toBe('1.3.');
  });

  it('keeps other years', () => {
    expect(formatShortTickDate('2024-06-07', now)).toBe('7.6.2024');
  });

  it('returns invalid input unchanged', () => {
    expect(formatShortTickDate('nope', now)).toBe('nope');
  });
});

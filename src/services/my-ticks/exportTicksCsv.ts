import { ClimbingTick } from '../../types';

const CSV_HEADERS = [
  'date',
  'route_name',
  'route_grade',
  'grade_system',
  'my_grade',
  'style',
  'note',
  'crag',
  'area',
  'route_short_id',
  'route_lon',
  'route_lat',
] as const;

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
const DANGEROUS_SPREADSHEET_PREFIX = /^[\t\r ]*[=+\-@]/;

const neutralizeSpreadsheetFormula = (value: string) =>
  DANGEROUS_SPREADSHEET_PREFIX.test(value) ? `'${value}` : value;

const toCsvValue = (value: string | number | null | undefined) => {
  if (value == null) {
    return escapeCsv('');
  }
  if (typeof value === 'number') {
    return escapeCsv(String(value));
  }
  return escapeCsv(neutralizeSpreadsheetFormula(value));
};

export const buildTicksCsv = (ticks: ClimbingTick[]): string => {
  const lines = [
    CSV_HEADERS.join(','),
    ...ticks.map((tick) =>
      [
        tick.timestamp,
        tick.routeName?.trim(),
        tick.routeGradeTxt?.trim(),
        'original',
        tick.myGrade,
        tick.style,
        tick.note,
        tick.routeCragName?.trim(),
        tick.routeAreaName?.trim(),
        tick.shortId,
        tick.routeLon,
        tick.routeLat,
      ]
        .map(toCsvValue)
        .join(','),
    ),
  ];
  return `${lines.join('\n')}\n`;
};

export const buildTicksCsvFilename = (
  displayName: string,
  now: Date = new Date(),
) => {
  const safeDisplayName =
    displayName
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9._-]/g, '_') || 'profile';
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `openclimbing-ticks-${safeDisplayName}-${yyyy}-${mm}-${dd}.csv`;
};

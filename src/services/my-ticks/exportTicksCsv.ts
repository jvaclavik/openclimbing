import { FetchedClimbingTick } from './getMyTicks';

const CSV_HEADERS = [
  'date',
  'route_name',
  'grade',
  'style',
  'points',
  'crag',
  'area',
  'route_short_id',
  'route_lon',
  'route_lat',
] as const;

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const toCsvValue = (value: string | number | null | undefined) =>
  escapeCsv(value == null ? '' : String(value));

export const buildTicksCsv = (ticks: FetchedClimbingTick[]): string => {
  const lines = [
    CSV_HEADERS.join(','),
    ...ticks.map((tick) =>
      [
        tick.date,
        tick.name,
        tick.grade,
        tick.style,
        tick.tickScore.points,
        tick.cragName,
        tick.areaName,
        tick.tick.shortId,
        tick.tick.routeLon ?? tick.center?.[0],
        tick.tick.routeLat ?? tick.center?.[1],
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
  return `openclimbing-ticks-${safeDisplayName}-${now.toISOString().slice(0, 10)}.csv`;
};

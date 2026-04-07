import {
  LocalStorageTick,
  TickStyle,
} from '../../components/FeaturePanel/Climbing/types';
import { t } from '../intl';

const KEY = 'ticks';

/** Pořadí segmentů ve skládaném grafu (stejné jako v TickStyleBadge). */
export const TICK_STYLE_SEGMENT_ORDER: TickStyle[] = [
  'OS',
  'FL',
  'RP',
  'PP',
  'RK',
  'AF',
  'TR',
  'FS',
  'PJ',
  null,
];

const NAMED_COLOR_HEX: Record<string, string> = {
  gray: '#9e9e9e',
  red: '#d32f2f',
  green: '#2e7d32',
  pink: '#e91e63',
  darkred: '#b71c1c',
  lightgreen: '#66bb6a',
  blue: '#1976d2',
  orange: '#ed6c02',
};

export function tickStyleToChartColor(style: TickStyle): string {
  const config = tickStyles.find((s) => s.key === style) ?? tickStyles[0];
  const c = config.color ?? 'gray';
  if (typeof c === 'string' && c.startsWith('#')) return c;
  return NAMED_COLOR_HEX[c] ?? '#9e9e9e';
}

export function coerceTickStyleFromDb(
  raw: string | null | undefined,
): TickStyle {
  if (raw == null || raw === '') return null;
  const hit = tickStyles.find((s) => s.key === raw);
  return hit ? hit.key : null;
}

export const tickStyles: Array<{
  key: TickStyle;
  name: string;
  description?: string;
  color?: string;
}> = [
  {
    key: null,
    name: 'Not selected',
    description: t('tick.style_description_not_selected'),
    color: 'gray',
  },
  {
    key: 'OS',
    name: 'On sight',
    description: t('tick.style_description_OS'),
    color: 'red',
  },
  {
    key: 'FL',
    name: 'Flash',
    description: t('tick.style_description_FL'),
    color: 'green',
  },
  {
    key: 'RP',
    name: 'Red point',
    description: t('tick.style_description_RP'),
    color: 'red',
  },
  {
    key: 'PP',
    name: 'Pink point',
    description: t('tick.style_description_PP'),
    color: 'pink',
  },
  {
    key: 'RK',
    name: 'Red cross',
    description: t('tick.style_description_RK'),
    color: 'darkred',
  },
  {
    key: 'AF',
    name: 'All free',
    description: t('tick.style_description_AF'),
    color: 'lightgreen',
  },
  {
    key: 'TR',
    name: 'Top rope',
    description: t('tick.style_description_TR'),
    color: 'blue',
  },
  {
    key: 'FS',
    name: 'Free solo',
    description: t('tick.style_description_FS'),
    color: 'orange',
  },
  {
    key: 'PJ',
    name: 'Project',
    description: t('tick.style_description_PJ'),
    color: '#9c27b0',
  },
];

const getLocalStorageItem = (key: string): Array<LocalStorageTick> => {
  if (typeof window === 'undefined') return [];
  const raw = window?.localStorage.getItem(key);
  if (raw) {
    try {
      const json = JSON.parse(raw);

      return json;
    } catch (e) {
      return [];
    }
  }
  return [];
};

/** @deprecated load ticks from useTicksContext */
export const getAllTicks = (): Array<LocalStorageTick> =>
  getLocalStorageItem(KEY);

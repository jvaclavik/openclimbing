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

/**
 * Centrální paleta pro tick styly. Hex barvy z Tailwind 600/700 shade —
 * dostatečně syté pro grafy, ale po snížení sytosti přes alpha čitelné v badge
 * v light i dark režimu. Vybrané tak, aby každý styl měl unikátní odstín.
 */
const TICK_STYLE_COLORS = {
  null: '#64748b', // slate-500: neutral, no style chosen
  OS: '#059669', // emerald-600: top achievement (clean on sight)
  FL: '#65a30d', // lime-600: second tier send
  RP: '#dc2626', // red-600: standard send
  PP: '#db2777', // pink-600: pinkpoint variant
  RK: '#92400e', // amber-800: aid involvement (rustic)
  AF: '#0e7490', // cyan-700: multipitch all free
  TR: '#2563eb', // blue-600: top rope
  FS: '#c2410c', // orange-700: free solo, intense
  PJ: '#7c3aed', // violet-600: project / in progress
} as const;

const FALLBACK_COLOR = TICK_STYLE_COLORS.null;

export function tickStyleToChartColor(style: TickStyle): string {
  const key = style === null ? 'null' : style;
  return (TICK_STYLE_COLORS as Record<string, string>)[key] ?? FALLBACK_COLOR;
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
  color: string;
}> = [
  {
    key: null,
    name: 'Not selected',
    description: t('tick.style_description_not_selected'),
    color: TICK_STYLE_COLORS.null,
  },
  {
    key: 'OS',
    name: 'On sight',
    description: t('tick.style_description_OS'),
    color: TICK_STYLE_COLORS.OS,
  },
  {
    key: 'FL',
    name: 'Flash',
    description: t('tick.style_description_FL'),
    color: TICK_STYLE_COLORS.FL,
  },
  {
    key: 'RP',
    name: 'Red point',
    description: t('tick.style_description_RP'),
    color: TICK_STYLE_COLORS.RP,
  },
  {
    key: 'PP',
    name: 'Pink point',
    description: t('tick.style_description_PP'),
    color: TICK_STYLE_COLORS.PP,
  },
  {
    key: 'RK',
    name: 'Red cross',
    description: t('tick.style_description_RK'),
    color: TICK_STYLE_COLORS.RK,
  },
  {
    key: 'AF',
    name: 'All free',
    description: t('tick.style_description_AF'),
    color: TICK_STYLE_COLORS.AF,
  },
  {
    key: 'TR',
    name: 'Top rope',
    description: t('tick.style_description_TR'),
    color: TICK_STYLE_COLORS.TR,
  },
  {
    key: 'FS',
    name: 'Free solo',
    description: t('tick.style_description_FS'),
    color: TICK_STYLE_COLORS.FS,
  },
  {
    key: 'PJ',
    name: 'Project',
    description: t('tick.style_description_PJ'),
    color: TICK_STYLE_COLORS.PJ,
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

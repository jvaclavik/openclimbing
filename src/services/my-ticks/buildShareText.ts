import { format, parseISO } from 'date-fns';
import { DEFAULT_DATA_FORMAT } from '../../config.mjs';
import { t } from '../intl';
import { TranslationId } from '../types';
import { FetchedClimbingTick } from './getMyTicks';
import { buildTickShareUrl, sessionDateFromTimestamp } from './ticksUrlFilter';

const formatDate = (iso: string): string => {
  try {
    return format(parseISO(iso), DEFAULT_DATA_FORMAT);
  } catch {
    return iso;
  }
};

const buildRouteLine = (
  tick: FetchedClimbingTick,
  { indent }: { indent: boolean },
): string => {
  const name = tick.name?.trim() || t('my_ticks.route_unnamed');
  const grade = tick.grade?.trim() ? ` ${tick.grade.trim()}` : '';
  const style = tick.style ? ` (${tick.style})` : '';
  const prefix = indent ? '  • ' : '• ';
  return `${prefix}${name}${grade}${style}`;
};

type CragGroup = {
  cragOsmType: string | null;
  cragOsmId: number | null;
  cragName: string | null;
  ticks: FetchedClimbingTick[];
};

const groupByCrag = (ticks: FetchedClimbingTick[]): CragGroup[] => {
  const order: string[] = [];
  const map = new Map<string, CragGroup>();
  for (const t of ticks) {
    const key =
      t.cragOsmType && t.cragOsmId != null
        ? `osm:${t.cragOsmType}:${t.cragOsmId}`
        : t.cragName?.trim()
          ? `name:${t.cragName.trim()}`
          : 'none';
    if (!map.has(key)) {
      order.push(key);
      map.set(key, {
        cragOsmType: t.cragOsmType ?? null,
        cragOsmId: t.cragOsmId ?? null,
        cragName: t.cragName?.trim() || null,
        ticks: [],
      });
    }
    map.get(key)!.ticks.push(t);
  }
  return order.map((k) => map.get(k)!);
};

const findCommonArea = (
  ticks: FetchedClimbingTick[],
): { name: string; osmType: string | null; osmId: number | null } | null => {
  if (ticks.length === 0) return null;
  const firstName = ticks[0].areaName?.trim();
  if (!firstName) return null;
  const firstId = ticks[0].areaOsmId ?? null;
  for (const t of ticks) {
    if ((t.areaName?.trim() || null) !== firstName) return null;
    if ((t.areaOsmId ?? null) !== firstId) return null;
  }
  return {
    name: firstName,
    osmType: ticks[0].areaOsmType ?? null,
    osmId: firstId,
  };
};

type PluralForm = 'singular' | 'few' | 'many';
const pluralForm = (count: number): PluralForm => {
  if (count === 1) return 'singular';
  if (count >= 2 && count <= 4) return 'few';
  return 'many';
};

const LEAD_SUMMARY_KEYS: Record<PluralForm, TranslationId> = {
  singular: 'my_ticks.share.text_lead_summary_singular',
  few: 'my_ticks.share.text_lead_summary_few',
  many: 'my_ticks.share.text_lead_summary_many',
};

const LEAD_SUMMARY_KEYS_NO_GRADE: Record<PluralForm, TranslationId> = {
  singular: 'my_ticks.share.text_lead_summary_singular_no_grade',
  few: 'my_ticks.share.text_lead_summary_few_no_grade',
  many: 'my_ticks.share.text_lead_summary_many_no_grade',
};

const buildLeadActivity = (
  commonAreaName: string | null,
  singleCragName: string | null,
): string => {
  if (commonAreaName) {
    return t('my_ticks.share.text_lead_activity_at_area', {
      area: commonAreaName,
    });
  }
  if (singleCragName) {
    return t('my_ticks.share.text_lead_activity_at_crag', {
      crag: singleCragName,
    });
  }
  return t('my_ticks.share.text_lead_activity_generic');
};

/**
 * Picks the grade label of the hardest sent route in the session, using the
 * climbing-grades table index when available. Returns null when no tick has a
 * resolvable grade (e.g. all projects / unknown grades).
 */
const findTopGrade = (ticks: FetchedClimbingTick[]): string | null => {
  let best: FetchedClimbingTick | null = null;
  let bestIndex = -1;
  for (const tick of ticks) {
    const idx = tick.tickScore?.gradeRowIndex;
    if (idx == null) continue;
    if (idx > bestIndex) {
      bestIndex = idx;
      best = tick;
    }
  }
  const grade = best?.grade?.trim();
  return grade ? grade : null;
};

/** Second line of the share text — count + hardest grade in plain prose. */
const buildLeadSummary = (ticks: FetchedClimbingTick[]): string => {
  const form = pluralForm(ticks.length);
  const topGrade = findTopGrade(ticks);
  if (topGrade) {
    return t(LEAD_SUMMARY_KEYS[form], {
      count: String(ticks.length),
      grade: topGrade,
    });
  }
  return t(LEAD_SUMMARY_KEYS_NO_GRADE[form], { count: String(ticks.length) });
};

const buildCragUrl = (
  baseUrl: string,
  osmType: string | null,
  osmId: number | null,
): string | null => {
  if (!osmType || osmId == null) return null;
  return `${baseUrl}/${osmType}/${osmId}`;
};

const buildBodyLines = (groups: CragGroup[]): string[] => {
  if (groups.length <= 1) {
    return (groups[0]?.ticks ?? []).map((tick) =>
      buildRouteLine(tick, { indent: false }),
    );
  }
  const lines: string[] = [];
  groups.forEach((group, idx) => {
    if (idx > 0) lines.push('');
    const cragLabel = group.cragName || t('my_ticks.share.text_unknown_crag');
    lines.push(t('my_ticks.share.text_crag_subheading', { crag: cragLabel }));
    for (const tick of group.ticks) {
      lines.push(buildRouteLine(tick, { indent: true }));
    }
  });
  return lines;
};

/**
 * Guide section: heading + per-crag block (label on one line, URL on the
 * next), blocks separated by a blank line for easier tapping on mobile.
 * Single-crag sessions collapse to heading + URL pair (no per-crag label).
 */
const buildGuideLines = (groups: CragGroup[], baseUrl: string): string[] => {
  const withLinks = groups
    .map((group) => ({
      name: group.cragName,
      url: buildCragUrl(baseUrl, group.cragOsmType, group.cragOsmId),
    }))
    .filter((entry) => entry.url) as Array<{
    name: string | null;
    url: string;
  }>;
  if (withLinks.length === 0) return [];
  if (withLinks.length === 1) {
    return [t('my_ticks.share.text_guide_section_heading'), withLinks[0].url];
  }
  const lines: string[] = [t('my_ticks.share.text_guide_section_heading')];
  withLinks.forEach((entry) => {
    lines.push('');
    const label = entry.name || t('my_ticks.share.text_unknown_crag');
    lines.push(t('my_ticks.share.text_crag_subheading', { crag: label }));
    lines.push(entry.url);
  });
  return lines;
};

type BuildSessionTextOptions = {
  sessionDate: string;
  sessionTicks: FetchedClimbingTick[];
  displayName: string;
  baseUrl: string;
};

export const buildSessionShareText = ({
  sessionDate,
  sessionTicks,
  displayName,
  baseUrl,
}: BuildSessionTextOptions): string => {
  const groups = groupByCrag(sessionTicks);
  const commonArea = findCommonArea(sessionTicks);
  const singleCragName =
    groups.length === 1 ? (groups[0].cragName ?? null) : null;

  const diaryUrl = buildTickShareUrl(baseUrl, displayName, {
    session: sessionDate,
  });

  // First 2 lines — what Strava shows in feed preview. Lead headline + a
  // prose summary with count and hardest grade.
  const previewBlock = [
    buildLeadActivity(commonArea?.name ?? null, singleCragName),
    buildLeadSummary(sessionTicks),
  ];

  const bodyLines = buildBodyLines(groups);

  const diaryDateBlock = [
    t('my_ticks.share.text_diary_heading', { date: formatDate(sessionDate) }),
    diaryUrl,
  ];

  const guideLines = buildGuideLines(groups, baseUrl);

  const sections = [
    previewBlock,
    bodyLines,
    diaryDateBlock,
    guideLines,
    [t('my_ticks.share.text_footer')],
  ].filter((section) => section.length > 0);

  return sections.map((section) => section.join('\n')).join('\n\n');
};

type BuildTickTextOptions = {
  tick: FetchedClimbingTick;
  displayName: string;
  baseUrl: string;
};

export const buildSingleTickShareText = ({
  tick,
  displayName,
  baseUrl,
}: BuildTickTextOptions): string => {
  const sessionDate = sessionDateFromTimestamp(tick.date);
  const url = buildTickShareUrl(baseUrl, displayName, {
    session: sessionDate,
    tickId: tick.tick.id,
  });

  const sections: string[][] = [];
  sections.push([buildRouteLine(tick, { indent: false })]);
  const crag = tick.cragName?.trim();
  if (crag) {
    sections.push([t('my_ticks.share.text_at_crag', { crag })]);
  }
  sections.push([url]);
  const cragUrl = buildCragUrl(baseUrl, tick.cragOsmType, tick.cragOsmId);
  if (cragUrl) {
    sections.push([t('my_ticks.share.text_guide_section_heading'), cragUrl]);
  }
  sections.push([t('my_ticks.share.text_footer')]);

  return sections.map((section) => section.join('\n')).join('\n\n');
};

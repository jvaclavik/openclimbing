import React from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { t, tPlural } from '../../../services/intl';
import { getUrlOsmId } from '../../../services/helpers';
import { getDifficulties } from '../../../services/tagging/climbing/routeGrade';
import { TickStyleBadge } from '../../../services/my-ticks/TickStyleBadge';
import {
  DayRecord,
  GradeRecord,
  PersonalRecords,
} from '../../../services/my-ticks/personalRecords';
import { ConvertedRouteDifficultyBadge } from '../../FeaturePanel/Climbing/ConvertedRouteDifficultyBadge';
import { GradeSystemSelect } from '../../FeaturePanel/Climbing/GradeSystemSelect';
import { TintedCard, formatCount, tint } from '../../utils/panelUi';
import { ProfileSection } from '../ProfileSection';
import { BigGradeBadge } from './BigGradeBadge';
import { formatShortTickDate } from '../../../services/my-ticks/tickDateFormat';

const routeHref = (record: GradeRecord) => `/${getUrlOsmId(record.row.apiId)}`;

const routeLabel = (record: GradeRecord) =>
  record.row.name?.trim() || t('my_ticks.route_unnamed');

const FeaturedRecord = ({ record }: { record: GradeRecord }) => (
  <TintedCard>
    <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center' }}>
      <BigGradeBadge routeDifficulties={getDifficulties(record.row.tags)} />
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('user_profile.records.hardest_send')}
        </Typography>
        <Typography
          component={Link}
          href={routeHref(record)}
          sx={{
            fontWeight: 700,
            fontSize: 17,
            lineHeight: 1.25,
            color: 'text.primary',
            textDecoration: 'none',
            overflowWrap: 'anywhere',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {routeLabel(record)}
        </Typography>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
        >
          <TickStyleBadge style={record.row.style} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {[record.row.cragName, formatShortTickDate(record.row.date)]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  </TintedCard>
);

type CellProps = {
  label: string;
  value: React.ReactNode;
  context?: React.ReactNode;
  onClick?: () => void;
};

const RecordCell = ({
  label,
  value,
  context,
  onClick,
  fullRow = false,
}: CellProps & { fullRow?: boolean }) => {
  const content = (
    <Stack spacing={0.25} sx={{ minWidth: 0, width: '100%' }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Box
        sx={{
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.3,
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
          fontVariantNumeric: 'tabular-nums',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Box>
      {context ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}
        >
          {context}
        </Typography>
      ) : null}
    </Stack>
  );
  // Tiles like the homepage stats: inner padding keeps content off the edge
  // of the hover surface.
  const tileSx = (theme) => ({
    ...(fullRow ? { gridColumn: '1 / -1' } : {}),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    textAlign: 'left',
    px: 1.75,
    py: 1.25,
    borderRadius: '12px',
    backgroundColor: tint(theme, 0.04),
  });
  return onClick ? (
    <ButtonBase
      onClick={onClick}
      sx={(theme) => ({
        ...tileSx(theme),
        transition: 'background-color 120ms',
        '&:hover': { backgroundColor: tint(theme, 0.07) },
        '&.Mui-focusVisible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      {content}
    </ButtonBase>
  ) : (
    <Box sx={tileSx}>{content}</Box>
  );
};

const gradeCell = (label: string, record: GradeRecord | null): CellProps =>
  record && {
    label,
    value: (
      <ConvertedRouteDifficultyBadge
        routeDifficulties={getDifficulties(record.row.tags)}
      />
    ),
    context: [routeLabel(record), record.row.cragName]
      .filter(Boolean)
      .join(' · '),
  };

const dayContext = (day: DayRecord) =>
  `${formatShortTickDate(day.day)} · ${tPlural(
    'user_profile.unit.sends',
    day.tickCount,
  )}`;

const buildCells = (
  records: PersonalRecords,
  onOpenDay: (day: string) => void,
): CellProps[] =>
  [
    gradeCell(
      t('user_profile.records.hardest_onsight'),
      records.hardestOnsight,
    ),
    gradeCell(t('user_profile.records.hardest_flash'), records.hardestFlash),
    records.bestDayByPoints && {
      label: t('user_profile.records.best_day'),
      value: t('user_profile.unit.points', {
        count: formatCount(Math.round(records.bestDayByPoints.points)),
      }),
      context: dayContext(records.bestDayByPoints),
      onClick: () => onOpenDay(records.bestDayByPoints.day),
    },
    records.bestDayByTicks && {
      label: t('user_profile.records.most_sends_day'),
      value: formatCount(records.bestDayByTicks.tickCount),
      context: formatShortTickDate(records.bestDayByTicks.day),
      onClick: () => onOpenDay(records.bestDayByTicks.day),
    },
    records.bestYear && {
      label: t('user_profile.records.best_year'),
      value: String(records.bestYear.year),
      context: [
        t('user_profile.unit.points', {
          count: formatCount(Math.round(records.bestYear.points)),
        }),
        tPlural('user_profile.unit.sends', records.bestYear.sendCount),
        tPlural('user_profile.unit.days', records.bestYear.days),
      ].join(' · '),
    },
    records.topCrag && {
      label: t('user_profile.records.top_crag'),
      value: records.topCrag.name,
      context: tPlural('user_profile.unit.days', records.topCrag.days),
    },
    records.cragCount > 0 && {
      label: t('user_profile.records.crag_count'),
      value: formatCount(records.cragCount),
      context: tPlural('user_profile.unit.days_total', records.climbingDays),
    },
  ].filter(Boolean) as CellProps[];

export const PersonalRecordsSection = ({
  records,
  onOpenDay,
}: {
  records: PersonalRecords;
  onOpenDay: (day: string) => void;
}) => {
  const cells = buildCells(records, onOpenDay);
  return (
    <ProfileSection
      title={t('user_profile.records.title')}
      addition={<GradeSystemSelect size="tiny" />}
    >
      <Stack spacing={1.5}>
        {records.hardestSend ? (
          <FeaturedRecord record={records.hardestSend} />
        ) : null}
        {cells.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            {cells.map((cell, i) => (
              <RecordCell
                key={cell.label}
                {...cell}
                // odd count: the last cell takes the whole row
                fullRow={cells.length % 2 === 1 && i === cells.length - 1}
              />
            ))}
          </Box>
        ) : null}
      </Stack>
    </ProfileSection>
  );
};

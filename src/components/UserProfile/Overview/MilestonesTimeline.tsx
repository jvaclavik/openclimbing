import React, { useState } from 'react';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FlagIcon from '@mui/icons-material/Flag';
import TerrainIcon from '@mui/icons-material/Terrain';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { t, tPlural } from '../../../services/intl';
import { Milestone } from '../../../services/my-ticks/personalRecords';
import { getDifficulties } from '../../../services/tagging/climbing/routeGrade';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { ConvertedRouteDifficultyBadge } from '../../FeaturePanel/Climbing/ConvertedRouteDifficultyBadge';
import { formatCount, tint } from '../../utils/panelUi';
import { ProfileSection } from '../ProfileSection';
import { TickDate } from '../../MyTicksPanel/TickDate';

const VISIBLE_COUNT = 5;

const routeContext = (row: FetchedClimbingTick) =>
  [row.name?.trim() || t('my_ticks.route_unnamed'), row.cragName]
    .filter(Boolean)
    .join(' · ');

const describe = (
  m: Milestone,
): { icon: React.ReactNode; title: React.ReactNode; sub?: string } => {
  switch (m.kind) {
    case 'grade_pb':
      return {
        icon: <TrendingUpIcon />,
        title: (
          <>
            {/* own element, so the row gap applies between text and badge */}
            <span>{t('user_profile.milestones.grade_pb')}</span>
            <ConvertedRouteDifficultyBadge
              routeDifficulties={getDifficulties(m.row.tags)}
            />
          </>
        ),
        sub: [routeContext(m.row), m.style].filter(Boolean).join(' · '),
      };
    case 'first_send':
      return {
        icon: <FlagIcon />,
        title: t('user_profile.milestones.first_send'),
        sub: routeContext(m.row),
      };
    case 'send_count':
      return {
        icon: <FlagIcon />,
        title: t('user_profile.milestones.send_count', {
          count: formatCount(m.count),
        }),
        sub: routeContext(m.row),
      };
    case 'climbing_days':
      return {
        icon: <EventAvailableIcon />,
        title: tPlural('user_profile.milestones.goal_days', m.count, {
          count: formatCount(m.count),
        }),
      };
    case 'crag_count':
      return {
        icon: <TerrainIcon />,
        title: tPlural('user_profile.milestones.goal_crags', m.count, {
          count: formatCount(m.count),
        }),
        sub: t('user_profile.milestones.new_crag', { name: m.cragName }),
      };
    default:
      return { icon: null, title: '' };
  }
};

const TimelineItem = ({
  milestone,
  isLast,
  onOpenDay,
}: {
  milestone: Milestone;
  isLast: boolean;
  onOpenDay: (day: string) => void;
}) => {
  const { icon, title, sub } = describe(milestone);
  const highlighted = milestone.kind === 'grade_pb';
  return (
    <ButtonBase
      onClick={() => onOpenDay(milestone.day)}
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: '24px minmax(0, 1fr) auto',
        columnGap: 1.25,
        alignItems: 'start',
        textAlign: 'left',
        width: '100%',
        pb: isLast ? 0.5 : 1.75,
        borderRadius: '8px',
        position: 'relative',
        // connecting line between dots
        '&::before': isLast
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              left: 11,
              top: 26,
              bottom: 2,
              width: 2,
              borderRadius: 1,
              backgroundColor: tint(theme, 0.08),
            },
        '&:hover': { backgroundColor: tint(theme, 0.03) },
      })}
    >
      <Box
        sx={(theme) => ({
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: highlighted
            ? theme.palette.primary.contrastText
            : theme.palette.primary.main,
          backgroundColor: highlighted
            ? theme.palette.primary.main
            : alpha(theme.palette.primary.main, 0.12),
          '& svg': { fontSize: 15 },
        })}
      >
        {icon}
      </Box>
      <Stack spacing={0.125} sx={{ minWidth: 0, pt: 0.25 }}>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'center', flexWrap: 'wrap', fontWeight: 700 }}
        >
          {title}
        </Stack>
        {sub ? (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {sub}
          </Typography>
        ) : null}
      </Stack>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          pt: 0.5,
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <TickDate value={milestone.day} />
      </Typography>
    </ButtonBase>
  );
};

export const MilestonesTimeline = ({
  milestones,
  onOpenDay,
}: {
  milestones: Milestone[];
  onOpenDay: (day: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  if (milestones.length === 0) return null;
  const visible = expanded ? milestones : milestones.slice(0, VISIBLE_COUNT);
  const canExpand = milestones.length > VISIBLE_COUNT;

  return (
    <ProfileSection
      title={t('user_profile.milestones.title')}
      addition={
        canExpand ? (
          <Button
            size="small"
            color="secondary"
            onClick={() => setExpanded((v) => !v)}
            sx={{ py: 0, minWidth: 0 }}
          >
            {expanded
              ? t('show_less')
              : t('user_profile.milestones.show_all', {
                  count: milestones.length,
                })}
          </Button>
        ) : null
      }
    >
      <Stack>
        {visible.map((milestone, i) => (
          <TimelineItem
            key={`${milestone.kind}-${milestone.day}-${i}`}
            milestone={milestone}
            isLast={i === visible.length - 1}
            onOpenDay={onOpenDay}
          />
        ))}
      </Stack>
    </ProfileSection>
  );
};

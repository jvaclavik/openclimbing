import { Box, Checkbox, Stack, TableCell, TableRow } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { getUrlOsmId } from '../../services/helpers';
import { TickStyleBadge } from '../../services/my-ticks/TickStyleBadge';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { getPartnersText } from '../../services/my-ticks/tickPairing';
import { getDifficulties } from '../../services/tagging/climbing/routeGrade';
import { ConvertedRouteDifficultyBadge } from '../FeaturePanel/Climbing/ConvertedRouteDifficultyBadge';
import { t } from '../../services/intl';
import { TickMoreButton } from '../FeaturePanel/Climbing/TickMoreButton';
import { useMapStateContext } from '../utils/MapStateContext';
import { tint } from '../utils/panelUi';
import { TickDate } from './TickDate';
import { TickRowCaption } from './TickRowCaption';
import { ACTION_CELL_CLASS, tickRowHoverSx } from './TickSessionCard';
import { TickPoints } from './TickPoints';
import { modifiersFromEvent, SelectionModifiers } from './tickSelection';

export type MyTicksRowSelection = {
  selected: boolean;
  onClick: (modifiers: SelectionModifiers) => void;
};

const highlightPulse = keyframes`
  0% { background-color: rgba(255, 213, 79, 0); }
  15% { background-color: rgba(255, 213, 79, 0.55); }
  60% { background-color: rgba(255, 213, 79, 0.35); }
  100% { background-color: rgba(255, 213, 79, 0); }
`;

/** Route name in tick lists: reads as a title, hover marks it as a link. */
export const ROUTE_NAME_SX = {
  fontWeight: 600,
  color: 'text.primary',
  textDecoration: 'none',
  '&:hover': { color: 'primary.main' },
} as const;

export const MyTicksRow = ({
  fetchedTick,
  readOnly = false,
  highlighted = false,
  showDate = true,
  showCrag = true,
  personalBest = false,
  selection,
}: {
  fetchedTick: FetchedClimbingTick;
  readOnly?: boolean;
  highlighted?: boolean;
  /** Hidden when rows are grouped under day headers. */
  showDate?: boolean;
  /** False when the day header already names the (only) crag. */
  showCrag?: boolean;
  /** Tick set a new personal best grade. */
  personalBest?: boolean;
  /** Set while bulk selection mode is active. */
  selection?: MyTicksRowSelection;
}) => {
  const router = useRouter();
  const routeDifficulties = getDifficulties(fetchedTick.tags);
  const { view } = useMapStateContext();
  const { name, style, date, apiId } = fetchedTick;
  const partners = getPartnersText(fetchedTick.tick);
  const routeLabel = name?.trim() ? name : t('my_ticks.route_unnamed');
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted]);

  return (
    <TableRow
      ref={rowRef}
      selected={selection?.selected ?? false}
      onClick={
        selection ? (e) => selection.onClick(modifiersFromEvent(e)) : undefined
      }
      // In selection mode a click must not follow links (e.g. @partner mentions).
      onClickCapture={
        selection
          ? (e) => {
              if ((e.target as HTMLElement).closest('a')) e.preventDefault();
            }
          : undefined
      }
      // Prevent the browser from selecting text on SHIFT+click ranges.
      onMouseDown={
        selection
          ? (e) => {
              if (e.shiftKey) e.preventDefault();
            }
          : undefined
      }
      sx={(theme) => ({
        '& > td': { borderBottom: `1px solid ${tint(theme, 0.05)}` },
        ...tickRowHoverSx(theme),
        ...(personalBest
          ? { backgroundColor: alpha(theme.palette.primary.main, 0.06) }
          : {}),
        ...(highlighted
          ? { animation: `${highlightPulse} 2.8s ease-out 1` }
          : {}),
        ...(selection ? { cursor: 'pointer' } : {}),
      })}
    >
      {selection ? (
        <TableCell padding="checkbox">
          <Checkbox
            size="small"
            checked={selection.selected}
            onClick={(e) => {
              e.stopPropagation();
              selection.onClick(modifiersFromEvent(e));
            }}
            slotProps={{
              input: { 'aria-label': t('my_ticks.select.select_row') },
            }}
          />
        </TableCell>
      ) : null}
      <TableCell>
        <Stack
          spacing={0.25}
          sx={{
            alignItems: 'flex-start',
          }}
        >
          {selection ? (
            <Box component="span" sx={ROUTE_NAME_SX}>
              {routeLabel}
            </Box>
          ) : (
            <Box
              component={Link}
              href={`/${getUrlOsmId(apiId)}?back=${encodeURIComponent(
                router.asPath,
              )}#${view.join('/')}`}
              sx={ROUTE_NAME_SX}
            >
              {routeLabel}
            </Box>
          )}
          <TickRowCaption
            personalBest={personalBest}
            cragName={showCrag ? fetchedTick.cragName : null}
            partners={partners}
            note={fetchedTick.tick.note}
          />
        </Stack>
      </TableCell>
      <TableCell>
        <ConvertedRouteDifficultyBadge routeDifficulties={routeDifficulties} />
      </TableCell>
      <TableCell>
        <TickStyleBadge style={style} />
      </TableCell>
      <TableCell
        sx={{
          textAlign: 'right',
          whiteSpace: 'nowrap',
          color: 'text.secondary',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <TickPoints points={fetchedTick.tickScore.points} />
      </TableCell>
      {showDate ? (
        <TableCell
          sx={{
            textAlign: 'right',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <TickDate value={date} />
        </TableCell>
      ) : null}
      {readOnly || selection ? null : (
        <TableCell className={ACTION_CELL_CLASS}>
          <TickMoreButton tick={fetchedTick.tick} fetchedTick={fetchedTick} />
        </TableCell>
      )}
    </TableRow>
  );
};

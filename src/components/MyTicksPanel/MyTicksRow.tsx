import { Checkbox, Stack, TableCell, TableRow } from '@mui/material';
import { keyframes } from '@mui/system';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { DEFAULT_DATA_FORMAT } from '../../config.mjs';
import { getUrlOsmId } from '../../services/helpers';
import { TickStyleBadge } from '../../services/my-ticks/TickStyleBadge';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { getPartnersText } from '../../services/my-ticks/tickPairing';
import { getDifficulties } from '../../services/tagging/climbing/routeGrade';
import { ConvertedRouteDifficultyBadge } from '../FeaturePanel/Climbing/ConvertedRouteDifficultyBadge';
import { PartnersMentionsText } from '../FeaturePanel/Climbing/PartnersMentionsText';
import { t } from '../../services/intl';
import { TickMoreButton } from '../FeaturePanel/Climbing/TickMoreButton';
import { useMapStateContext } from '../utils/MapStateContext';
import { SelectionModifiers } from './tickSelection';

export type MyTicksRowSelection = {
  selected: boolean;
  onClick: (modifiers: SelectionModifiers) => void;
};

const getModifiers = (e: React.MouseEvent): SelectionModifiers => ({
  shiftKey: e.shiftKey,
  metaKey: e.metaKey,
  ctrlKey: e.ctrlKey,
});

const highlightPulse = keyframes`
  0% { background-color: rgba(255, 213, 79, 0); }
  15% { background-color: rgba(255, 213, 79, 0.55); }
  60% { background-color: rgba(255, 213, 79, 0.35); }
  100% { background-color: rgba(255, 213, 79, 0); }
`;

// Defenzivně: nevalidní timestamp ticku nesmí shodit celou tabulku/profil
// (date-fns `format` hodí RangeError: Invalid time value).
const formatTickDate = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? (value ?? '')
    : format(parsed, DEFAULT_DATA_FORMAT);
};

export const MyTicksRow = ({
  fetchedTick,
  readOnly = false,
  highlighted = false,
  selection,
}: {
  fetchedTick: FetchedClimbingTick;
  readOnly?: boolean;
  highlighted?: boolean;
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
      hover={!!selection}
      selected={selection?.selected ?? false}
      onClick={
        selection ? (e) => selection.onClick(getModifiers(e)) : undefined
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
      sx={{
        ...(highlighted
          ? { animation: `${highlightPulse} 2.8s ease-out 1` }
          : {}),
        ...(selection ? { cursor: 'pointer' } : {}),
      }}
    >
      {selection ? (
        <TableCell padding="checkbox">
          <Checkbox
            size="small"
            checked={selection.selected}
            onClick={(e) => {
              e.stopPropagation();
              selection.onClick(getModifiers(e));
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
            <span>{routeLabel}</span>
          ) : (
            <Link
              href={`/${getUrlOsmId(apiId)}?back=${encodeURIComponent(
                router.asPath,
              )}#${view.join('/')}`}
            >
              {routeLabel}
            </Link>
          )}
          {partners.trim() ? (
            <PartnersMentionsText text={partners} variant="caption" />
          ) : null}
        </Stack>
      </TableCell>
      <TableCell>
        <ConvertedRouteDifficultyBadge routeDifficulties={routeDifficulties} />
      </TableCell>
      <TableCell>
        <TickStyleBadge style={style} />
      </TableCell>
      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        {fetchedTick.tickScore.points}
      </TableCell>
      <TableCell sx={{ textAlign: 'right' }}>{formatTickDate(date)}</TableCell>
      {readOnly || selection ? null : (
        <TableCell>
          <TickMoreButton tick={fetchedTick.tick} fetchedTick={fetchedTick} />
        </TableCell>
      )}
    </TableRow>
  );
};

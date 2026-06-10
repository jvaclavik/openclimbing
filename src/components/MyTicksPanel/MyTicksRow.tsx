import { Stack, TableCell, TableRow } from '@mui/material';
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
}: {
  fetchedTick: FetchedClimbingTick;
  readOnly?: boolean;
  highlighted?: boolean;
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
      sx={
        highlighted
          ? { animation: `${highlightPulse} 2.8s ease-out 1` }
          : undefined
      }
    >
      <TableCell>
        <Stack spacing={0.25} alignItems="flex-start">
          <Link
            href={`/${getUrlOsmId(apiId)}?back=${encodeURIComponent(
              router.asPath,
            )}#${view.join('/')}`}
          >
            {routeLabel}
          </Link>
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
      {readOnly ? null : (
        <TableCell>
          <TickMoreButton tick={fetchedTick.tick} fetchedTick={fetchedTick} />
        </TableCell>
      )}
    </TableRow>
  );
};

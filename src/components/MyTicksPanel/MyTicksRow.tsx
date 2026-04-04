import { Stack, TableCell, TableRow } from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
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

export const MyTicksRow = ({
  fetchedTick,
  readOnly = false,
}: {
  fetchedTick: FetchedClimbingTick;
  readOnly?: boolean;
}) => {
  const routeDifficulties = getDifficulties(fetchedTick.tags);
  const { view } = useMapStateContext();
  const { name, style, date, apiId } = fetchedTick;
  const partners = getPartnersText(fetchedTick.tick);
  const routeLabel = name?.trim() ? name : t('my_ticks.route_unnamed');

  return (
    <TableRow>
      <TableCell>
        <Stack spacing={0.25} alignItems="flex-start">
          <Link href={`/${getUrlOsmId(apiId)}#${view.join('/')}`}>
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
      <TableCell sx={{ textAlign: 'right' }}>
        {format(date, DEFAULT_DATA_FORMAT)}
      </TableCell>
      {readOnly ? null : (
        <TableCell>
          <TickMoreButton tick={fetchedTick.tick} />
        </TableCell>
      )}
    </TableRow>
  );
};

import React from 'react';
import {
  Checkbox,
  Chip,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { DEFAULT_DATA_FORMAT } from '../../../config.mjs';
import { t } from '../../../services/intl';
import { getUrlOsmId } from '../../../services/helpers';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { TickStyleBadge } from '../../../services/my-ticks/TickStyleBadge';
import { getPartnersText } from '../../../services/my-ticks/tickPairing';
import { profilePathForOsmDisplayName } from '../../../services/my-ticks/profilePaths';
import { getDifficulties } from '../../../services/tagging/climbing/routeGrade';
import { ConvertedRouteDifficultyBadge } from '../../FeaturePanel/Climbing/ConvertedRouteDifficultyBadge';
import { PartnersMentionsText } from '../../FeaturePanel/Climbing/PartnersMentionsText';
import { useMapStateContext } from '../../utils/MapStateContext';
import { modifiersFromEvent, SelectionModifiers } from '../tickSelection';

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : format(parsed, DEFAULT_DATA_FORMAT);
};

type Props = {
  row: FetchedClimbingTick;
  ownerDisplayName: string | null;
  alreadyLogged: boolean;
  adding: boolean;
  onAdd: () => void;
  /** Set while bulk selection mode is active. */
  selection?: {
    selected: boolean;
    onClick: (modifiers: SelectionModifiers) => void;
  };
};

const OwnerLine = ({
  ownerDisplayName,
  partners,
}: {
  ownerDisplayName: string | null;
  partners: string;
}) => (
  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
    {ownerDisplayName ? (
      <>
        {t('my_ticks.mentions.logged_by')}{' '}
        <Link href={profilePathForOsmDisplayName(ownerDisplayName)}>
          @{ownerDisplayName}
        </Link>
      </>
    ) : null}
    {partners.trim() ? (
      <>
        {ownerDisplayName ? ' · ' : null}
        <PartnersMentionsText text={partners} variant="caption" />
      </>
    ) : null}
  </Typography>
);

const ActionCell = ({
  alreadyLogged,
  adding,
  onAdd,
}: Pick<Props, 'alreadyLogged' | 'adding' | 'onAdd'>) => (
  <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
    {alreadyLogged ? (
      <Chip
        size="small"
        variant="outlined"
        color="success"
        icon={<CheckIcon />}
        label={t('my_ticks.mentions.already_logged')}
      />
    ) : (
      <Tooltip title={t('my_ticks.mentions.add_one')}>
        <span>
          <IconButton
            color="primary"
            size="small"
            disabled={adding}
            onClick={onAdd}
            aria-label={t('my_ticks.mentions.add_one')}
          >
            <PlaylistAddIcon />
          </IconButton>
        </span>
      </Tooltip>
    )}
  </TableCell>
);

export const MentionedTickRow = ({
  row,
  ownerDisplayName,
  alreadyLogged,
  adding,
  onAdd,
  selection,
}: Props) => {
  const router = useRouter();
  const { view } = useMapStateContext();
  const routeLabel = row.name?.trim() ? row.name : t('my_ticks.route_unnamed');
  const selectable = selection && !alreadyLogged;

  return (
    <TableRow
      hover={!!selectable}
      selected={selection?.selected ?? false}
      onClick={
        selectable ? (e) => selection.onClick(modifiersFromEvent(e)) : undefined
      }
      onClickCapture={
        selection
          ? (e) => {
              if ((e.target as HTMLElement).closest('a')) e.preventDefault();
            }
          : undefined
      }
      onMouseDown={
        selection
          ? (e) => {
              if (e.shiftKey) e.preventDefault();
            }
          : undefined
      }
      sx={{
        ...(selectable ? { cursor: 'pointer' } : {}),
        ...(alreadyLogged ? { opacity: 0.6 } : {}),
      }}
    >
      {selection ? (
        <TableCell padding="checkbox">
          <Checkbox
            size="small"
            checked={selection.selected}
            disabled={alreadyLogged}
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
        <Stack spacing={0.25} sx={{ alignItems: 'flex-start' }}>
          {selection ? (
            <span>{routeLabel}</span>
          ) : (
            <Link
              href={`/${getUrlOsmId(row.apiId)}?back=${encodeURIComponent(
                router.asPath,
              )}#${view.join('/')}`}
            >
              {routeLabel}
            </Link>
          )}
          <OwnerLine
            ownerDisplayName={ownerDisplayName}
            partners={getPartnersText(row.tick)}
          />
        </Stack>
      </TableCell>
      <TableCell>
        <ConvertedRouteDifficultyBadge
          routeDifficulties={getDifficulties(row.tags)}
        />
      </TableCell>
      <TableCell>
        <TickStyleBadge style={row.style} />
      </TableCell>
      <TableCell sx={{ textAlign: 'right' }}>{formatDate(row.date)}</TableCell>
      {selection ? null : (
        <ActionCell
          alreadyLogged={alreadyLogged}
          adding={adding}
          onAdd={onAdd}
        />
      )}
    </TableRow>
  );
};

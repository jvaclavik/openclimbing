import React from 'react';
import {
  Box,
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
import { tint } from '../../utils/panelUi';
import { ROUTE_NAME_SX } from '../MyTicksRow';
import { TickRowCaption } from '../TickRowCaption';
import { ACTION_CELL_CLASS, tickRowHoverSx } from '../TickSessionCard';
import { modifiersFromEvent, SelectionModifiers } from '../tickSelection';

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
  <TableCell className={ACTION_CELL_CLASS}>
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
      sx={(theme) => ({
        '& > td': { borderBottom: `1px solid ${tint(theme, 0.05)}` },
        ...(selectable || !selection ? tickRowHoverSx(theme) : {}),
        ...(selectable ? { cursor: 'pointer' } : {}),
        ...(alreadyLogged ? { opacity: 0.6 } : {}),
      })}
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
            <Box component="span" sx={ROUTE_NAME_SX}>
              {routeLabel}
            </Box>
          ) : (
            <Box
              component={Link}
              href={`/${getUrlOsmId(row.apiId)}?back=${encodeURIComponent(
                router.asPath,
              )}#${view.join('/')}`}
              sx={ROUTE_NAME_SX}
            >
              {routeLabel}
            </Box>
          )}
          <OwnerLine
            ownerDisplayName={ownerDisplayName}
            partners={getPartnersText(row.tick)}
          />
          <TickRowCaption note={row.tick.note} />
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

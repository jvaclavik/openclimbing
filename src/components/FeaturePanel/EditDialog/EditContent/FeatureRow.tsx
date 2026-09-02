import {
  CircularProgress,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import styled from '@emotion/styled';
import React from 'react';
import { useEditContext } from '../context/EditContext';
import { useLoadingState } from '../../../utils/useLoadingState';
import { PoiIcon } from '../../../utils/icons/PoiIcon';
import { isDesktop } from '../../../helpers';
import { findInItems } from '../context/utils';
import { getDifficulties } from '../../../../services/tagging/climbing/routeGrade';
import { ConvertedRouteDifficultyBadge } from '../../Climbing/ConvertedRouteDifficultyBadge';
import { usePhotoHighlightContext } from '../../Climbing/contexts/PhotoHighlightContext';
import { isRouteDrawnOnPhoto } from '../../Climbing/utils/photo';
import { t } from '../../../../services/intl';
import { useMoreMenu } from '../../Climbing/useMoreMenu';
import { FeatureTags } from '../../../../services/types';
import { getApiId } from '../../../../services/helpers';
import { findPreset } from '../../../../services/tagging/presets';
import { getPresetTranslation } from '../../../../services/tagging/translations';
import { isClimbingRoute } from '../../../../utils';

const StyledListItem = styled(ListItem)`
  margin: 2px 4px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;

  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme }) =>
        alpha(theme.palette.primary.main, 0.08)};
    }
  }

  &:active {
    background-color: ${({ theme }) => alpha(theme.palette.primary.main, 0.12)};
  }
`;

const StyledPresetLabel = styled(Typography)`
  display: none;
  @media ${isDesktop} {
    display: block;
  }
`;

const getPresetLabelFromTags = (shortId: string, tags: FeatureTags) => {
  const preset = findPreset(getApiId(shortId).type, tags);
  return getPresetTranslation(preset.presetKey);
};

const RowLabel = ({
  name,
  presetLabel,
  fallback,
  tags,
  highlighted,
  loaded,
}: {
  name?: string;
  presetLabel?: string;
  fallback: string;
  tags?: FeatureTags;
  highlighted?: boolean;
  loaded: boolean;
}) => {
  const hasGrade =
    !!tags && Object.keys(tags).some((k) => k.startsWith('climbing:grade:'));
  const routeDifficulties = tags ? getDifficulties(tags) : undefined;
  const meta =
    tags && isClimbingRoute(tags)
      ? tags.author?.trim() || undefined
      : undefined;
  const title = name || presetLabel || fallback;

  return (
    <Stack
      direction="row"
      sx={{
        gap: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        mr: 1,
      }}
    >
      <Stack direction="column">
        <Typography
          sx={{
            fontWeight: highlighted ? 700 : loaded ? 500 : undefined,
          }}
        >
          {title}
        </Typography>
        {meta ? (
          <Typography color="secondary" variant="caption">
            {meta}
          </Typography>
        ) : null}
        {name && presetLabel ? (
          <StyledPresetLabel color="secondary" variant="caption">
            {presetLabel}
          </StyledPresetLabel>
        ) : null}
      </Stack>
      {hasGrade && (
        <ConvertedRouteDifficultyBadge routeDifficulties={routeDifficulties} />
      )}
    </Stack>
  );
};

type FeatureRowMoreMenuProps = {
  onRemove: () => void | Promise<void>;
};

const FeatureRowMoreMenu = ({ onRemove }: FeatureRowMoreMenuProps) => {
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();

  return (
    <>
      <IconButton
        size="small"
        color="secondary"
        aria-label={t('editdialog.remove')}
        onClick={handleClickMore}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <MoreMenu>
        <MenuItem
          onClick={(e) => {
            handleCloseMore(e);
            onRemove();
          }}
        >
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t('editdialog.remove')}
        </MenuItem>
      </MoreMenu>
    </>
  );
};

type Props = {
  shortId: string;
  onClick: (e: React.MouseEvent) => Promise<void>;
  originalLabel?: string;
  previewTags?: FeatureTags;
  role?: string;
  onRemove?: () => void | Promise<void>;
};

export const FeatureRow = ({
  shortId,
  onClick,
  originalLabel,
  previewTags,
  role,
  onRemove,
}: Props) => {
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const { items } = useEditContext();
  const { highlightedPhoto } = usePhotoHighlightContext();
  const dataItem = findInItems(items, shortId);
  const loaded = !!dataItem;
  const tags = dataItem?.tags ?? previewTags;
  const name = dataItem?.tags.name ?? previewTags?.name;
  const presetLabel =
    dataItem?.presetLabel ??
    (tags ? getPresetLabelFromTags(shortId, tags) : undefined);
  const highlighted =
    !!dataItem && isRouteDrawnOnPhoto(dataItem.tags, highlightedPhoto);
  const handleClick = (e: React.MouseEvent) => {
    startLoading();
    onClick(e).then(() => {
      stopLoading();
    });
  };

  return (
    <StyledListItem onClick={handleClick}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <ListItemText>
          <Stack
            direction="row"
            sx={{
              gap: 2,
              alignItems: 'center',
              opacity: loaded ? 1 : 0.55,
            }}
          >
            {tags ? (
              <PoiIcon
                tags={tags}
                size={16}
                middle
                themed
                highlighted={highlighted}
              />
            ) : null}
            <RowLabel
              name={name}
              presetLabel={presetLabel}
              fallback={originalLabel || shortId}
              tags={tags}
              highlighted={highlighted}
              loaded={loaded}
            />
            {role && (
              <>
                <div style={{ flex: '1' }} />
                <Typography variant="caption">{role}</Typography>
              </>
            )}
          </Stack>
        </ListItemText>
        {isLoading ? (
          <CircularProgress size={14} />
        ) : (
          <Stack
            direction="row"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {onRemove && <FeatureRowMoreMenu onRemove={onRemove} />}
            <ChevronRightIcon color={loaded ? 'primary' : 'disabled'} />
          </Stack>
        )}
      </Stack>
    </StyledListItem>
  );
};

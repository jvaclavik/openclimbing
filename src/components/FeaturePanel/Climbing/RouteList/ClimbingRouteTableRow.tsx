import styled from '@emotion/styled';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import Router from 'next/router';
import React, { forwardRef, useState } from 'react';
import { getOsmappLink, getShortId } from '../../../../services/helpers';
import { intl, t } from '../../../../services/intl';
import { featureToItem } from '../../../../services/my-lists/featureToItem';
import { PROJECT_ID } from '../../../../services/project';
import {
  getDifficulties,
  getDifficulty,
  getDifficultyColor,
  getGradeIndexFromTags,
} from '../../../../services/tagging/climbing/routeGrade';
import { useTheme } from '@mui/material';
import { Feature, LonLat } from '../../../../services/types';
import { ListBadges } from '../../../MyLists/ListBadges';
import { ListPickerDialog } from '../../../MyLists/ListPickerDialog';
import { useMapStateContext } from '../../../utils/MapStateContext';
import { useMyListsContext } from '../../../utils/MyListsContext';
import { useOsmAuthContext } from '../../../utils/OsmAuthContext';
import { useSnackbar } from '../../../utils/SnackbarContext';
import { useTicksContext } from '../../../utils/TicksContext';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { useEditDialogContext } from '../../helpers/EditDialogContext';
import { ClimbingBadges } from '../ClimbingBadges';
import { ConvertedRouteDifficultyBadge } from '../ConvertedRouteDifficultyBadge';
import { RouteNumber } from '../RouteNumber';
import { useMoreMenu } from '../useMoreMenu';
import {
  getWikimediaCommonsPhotoPathKeys,
  isRouteDrawnOnPhoto,
} from '../utils/photo';
import { usePhotoHighlightContext } from '../contexts/PhotoHighlightContext';

const Container = styled.div`
  width: 100%;
  container-type: inline-size;
`;

const NameColumn = styled(Stack)`
  // Hide name/description/author when the row becomes too narrow so the panel
  // can shrink down to ~100px without horizontal overflow.
  @container (max-width: 220px) {
    display: none;
  }
`;
const RouteNumberContainer = styled.div`
  width: 22px;
`;

const RouteNameContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 8px;
  position: relative;
  align-items: center;
  user-select: text;
  -webkit-user-select: text;
`;

const RouteDescriptionContainer = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.palette.text.secondary};
  user-select: text;
  -webkit-user-select: text;
`;

const RouteAuthorContainer = styled(RouteDescriptionContainer)``;

const RouteGradeContainer = styled.div`
  // When the name column is hidden the grade sits next to the route number
  // instead of drifting to the row's centre (via flex space-between).
  @container (max-width: 220px) {
    margin-right: auto;
  }
`;

const MoreMenuContainer = styled.div`
  @container (max-width: 220px) {
    display: none;
  }
`;

const RouteListBadges = ({ shortId }: { shortId: string }) => {
  const { listsContaining } = useMyListsContext();
  return <ListBadges lists={listsContaining(shortId)} />;
};

const Row = styled('a', {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $isHoverHighlighted: boolean; $isVisible: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 12px;
  border-bottom: solid 1px ${({ theme }) => theme.palette.divider};
  color: ${({ theme }) => theme.palette.text.primary};
  cursor: pointer;
  padding: 8px;
  transition: all 0.1s;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0.2)};

  *,
  &:focus {
    text-decoration: none;
  }

  &:hover {
    text-decoration: none;
    background-color: ${({ $isHoverHighlighted }) =>
      $isHoverHighlighted ? 'rgba(0, 0, 0, 0.1)' : ''};
  }
`;

type AddTickMenuItemProps = {
  feature: Feature;
  closeMenu: (event: React.MouseEvent) => void;
};
const AddTickMenuItem = ({ feature, closeMenu }: AddTickMenuItemProps) => {
  const { loggedIn } = useOsmAuthContext();
  const { addTick } = useTicksContext();
  const { showToast } = useSnackbar();
  const [loading, setLoading] = useState(false);

  if (PROJECT_ID !== 'openclimbing') {
    return null; // ticks are not loaded in context
  }

  const handleAddTick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!loggedIn) {
      showToast('Please log in to add tick.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await addTick(getShortId(feature.osmMeta));
    } catch (e) {
      showToast(`Error: ${e}`, 'error');
    } finally {
      setLoading(false);
      closeMenu(event);
    }
  };

  return (
    <MenuItem onClick={handleAddTick} disableRipple>
      <CheckIcon />
      {t('climbingpanel.add_tick')}
      &nbsp;
      {loading && <CircularProgress size={24} />}
    </MenuItem>
  );
};

const viewToLonLat = (view: [string, string, string]): LonLat => [
  parseFloat(view[2]),
  parseFloat(view[1]),
];

type AddToListMenuItemProps = {
  closeMenu: (event: React.MouseEvent) => void;
  onOpenPicker: () => void;
};
const AddToListMenuItem = ({
  closeMenu,
  onOpenPicker,
}: AddToListMenuItemProps) => {
  const { loggedIn, handleLogin } = useOsmAuthContext();
  const { showToast } = useSnackbar();

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    closeMenu(event);
    if (!loggedIn) {
      showToast(
        t('mylists.login_required'),
        'info',
        <span style={{ display: 'inline-block' }}>
          <button type="button" onClick={handleLogin}>
            {t('mylists.login_cta')}
          </button>
        </span>,
      );
      return;
    }
    onOpenPicker();
  };

  return (
    <MenuItem onClick={handleClick} disableRipple>
      <BookmarkAddOutlinedIcon />
      {t('mylists.add_to_list')}
    </MenuItem>
  );
};

type MoreMenuProps = {
  feature: Feature;
};
const MoreMenu = ({ feature }: MoreMenuProps) => {
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();
  const { open: openEditDialog } = useEditDialogContext();
  const { view } = useMapStateContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const routeDetailUrl = getRouteDetailUrl(feature);
  const pickerItem = featureToItem(feature, viewToLonLat(view));

  const handleShowRouteDetail = (event: React.MouseEvent) => {
    handleCloseMore(event);
    event.stopPropagation();
  };

  // React synthetic events bubble through the virtual tree even from portaled
  // MUI Menu items, so without this stop the Row's onClick (Router.push to
  // /climbing/route/X, which opens ClimbingCragDialog) would still fire for
  // every menu item click.
  const swallowBubble = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <span onClick={swallowBubble}>
      <IconButton color="secondary" onClick={handleClickMore}>
        <MoreHorizIcon color="secondary" />
      </IconButton>

      <MoreMenu>
        <AddTickMenuItem feature={feature} closeMenu={handleCloseMore} />
        <AddToListMenuItem
          closeMenu={handleCloseMore}
          onOpenPicker={() => setPickerOpen(true)}
        />

        <MenuItem
          onClick={(e: React.MouseEvent) => {
            handleShowRouteDetail(e);
            Router.push(routeDetailUrl).then(() => {
              openEditDialog();
            });
          }}
        >
          <EditIcon />
          {t('climbingpanel.edit_route')}
        </MenuItem>
        <MenuItem
          component={Link}
          href={routeDetailUrl}
          locale={intl.lang}
          onClick={handleShowRouteDetail}
        >
          {t('climbingpanel.show_route_detail')}
        </MenuItem>
      </MoreMenu>

      <ListPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        item={pickerItem}
      />
    </span>
  );
};

const getRouteDetailUrl = (feature: Feature) =>
  `${getOsmappLink(feature)}${typeof window !== 'undefined' ? window.location.hash : ''}`;

const RouteDescription = ({ feature }: { feature: Feature }) =>
  feature.tags?.description ? (
    <RouteDescriptionContainer>
      <Typography variant="inherit" component="p">
        {feature.tags?.description}
      </Typography>
    </RouteDescriptionContainer>
  ) : null;

const RouteAuthor = ({ feature }: { feature: Feature }) =>
  feature.tags?.author ? (
    <RouteAuthorContainer>{feature.tags?.author}</RouteAuthorContainer>
  ) : null;

const RouteName = (props: {
  feature: Feature;
  selected: boolean;
  highlighted?: boolean;
}) => {
  return (
    <RouteNameContainer>
      <Typography
        variant="inherit"
        component="h3"
        fontWeight={props.highlighted ? 700 : undefined}
      >
        {props.feature.tags?.name}
      </Typography>
    </RouteNameContainer>
  );
};

const RouteGrade = ({ feature }: { feature: Feature }) => {
  const routeDifficulties = getDifficulties(feature.tags);
  return (
    <RouteGradeContainer>
      <ConvertedRouteDifficultyBadge routeDifficulties={routeDifficulties} />
    </RouteGradeContainer>
  );
};

type Props = {
  feature: Feature;
  index: number;
  onClick: (e: any) => void;
  onMouseEnter?: (e: any) => void;
  onMouseLeave?: (e: any) => void;
  isHoverHighlighted?: boolean;
  isSelected?: boolean;
  isHrefLinkVisible?: boolean;
};

export const ClimbingRouteTableRow = forwardRef<HTMLDivElement, Props>(
  (
    {
      feature,
      index,
      onClick,
      onMouseEnter,
      onMouseLeave,
      isHoverHighlighted = false,
      isSelected = false,
      isHrefLinkVisible = true,
    },
    ref,
  ) => {
    const { isTicked } = useTicksContext();
    const { climbingFilter } = useUserSettingsContext();
    const { highlightedPhoto } = usePhotoHighlightContext();
    const theme = useTheme();
    const { gradeInterval } = climbingFilter;
    const [minIndex, maxIndex] = gradeInterval;
    if (!feature) {
      return null;
    }

    const isDrawnOnHighlightedPhoto = isRouteDrawnOnPhoto(
      feature.tags,
      highlightedPhoto,
    );
    const photoPathsCount = getWikimediaCommonsPhotoPathKeys(
      feature.tags,
    ).length;
    const difficultyColor = getDifficultyColor(
      getDifficulty(feature.tags),
      theme.palette.mode === 'dark' ? 'dark' : 'light',
    );
    const shortId = getShortId(feature.osmMeta);
    const hasTick = isTicked(shortId);
    const gradeIndex = getGradeIndexFromTags(feature.tags);
    const isVisible =
      !gradeIndex || (gradeIndex >= minIndex && gradeIndex <= maxIndex);

    return (
      <>
        <Container ref={ref}>
          <Row
            $isVisible={isVisible}
            onClick={(e) => {
              onClick(e);
              e.preventDefault();
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            $isHoverHighlighted={isHoverHighlighted}
            as={isHrefLinkVisible ? 'a' : 'div'}
            href={isHrefLinkVisible ? getRouteDetailUrl(feature) : undefined}
            // @ts-ignore
            locale={isHrefLinkVisible ? intl.lang : undefined}
          >
            <RouteNumberContainer>
              <RouteNumber
                color={difficultyColor}
                hasCircle={photoPathsCount > 0}
                hasTick={hasTick}
                highlighted={isDrawnOnHighlightedPhoto}
              >
                {index + 1}
              </RouteNumber>
            </RouteNumberContainer>
            <NameColumn justifyContent="stretch" flex={1}>
              <Stack direction="row" gap={1}>
                <RouteName
                  feature={feature}
                  selected={isSelected}
                  highlighted={isDrawnOnHighlightedPhoto}
                />
                <RouteListBadges shortId={shortId} />
              </Stack>
              <RouteDescription feature={feature} />
              <RouteAuthor feature={feature} />
              <ClimbingBadges feature={feature} dense subtle />
            </NameColumn>
            <RouteGrade feature={feature} />
            <MoreMenuContainer>
              <MoreMenu feature={feature} />
            </MoreMenuContainer>
          </Row>
        </Container>
      </>
    );
  },
);
ClimbingRouteTableRow.displayName = 'ClimbingTableRow';

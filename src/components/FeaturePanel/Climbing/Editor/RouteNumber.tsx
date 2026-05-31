/* eslint-disable react/jsx-props-no-spreading */
import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import { getShortId } from '../../../../services/helpers';
import { useMobileMode } from '../../../helpers';
import { useTicksContext } from '../../../utils/TicksContext';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { getShiftForStartPoint } from '../utils/startPoint';
import { useRouteNumberColors } from '../utils/useRouteNumberColors';
import { RouteDifficulty } from './RouteDifficulty';

const Text = styled.text<{ $scale: number }>`
  user-select: none;
  font-size: ${({ $scale }) => 12 / $scale}px;
  font-family: 'Roboto', sans-serif;
  font-weight: 600;
`;

const RouteNameBoxBase = styled.rect`
  pointer-events: all;
`;

const HoverableRouteName = RouteNameBoxBase;
const RouteNameOutline = RouteNameBoxBase;
const RouteNameBox = RouteNameBoxBase;

const CheckCircle = ({ x, y, scale }) => {
  const theme = useTheme();
  return (
    <g
      transform={`translate(${x + 3} ${y - 17}) scale(0.5) scale(${1 / scale})`}
      x={x}
      y={y}
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"
        fill={theme.palette.success.main}
      />
    </g>
  );
};

type Props = {
  routeIndex: number;
  x: number;
  y: number;
  shortId: string;
};

const RouteNumberBadge = ({ routeIndex, x, y, shortId }: Props) => {
  const { isTicked } = useTicksContext();
  const isMobileMode = useMobileMode();
  const {
    photoZoom,
    isRouteSelected,
    machine,
    isEditMode,
    routeIndexHovered,
    setRouteIndexHovered,
  } = useClimbingContext();
  const digits = String(routeIndex).length;
  const RECT_WIDTH = ((digits > 2 ? digits : 0) * 3 + 18) / photoZoom.scale;
  const RECT_HEIGHT = 18 / photoZoom.scale;
  const RECT_Y_OFFSET = 8 / photoZoom.scale;
  const OUTLINE_WIDTH = 2 / photoZoom.scale;
  const HOVER_WIDTH = 10 / photoZoom.scale;
  const TEXT_Y_SHIFT = 13 / photoZoom.scale;

  const onMouseEnter = isMobileMode
    ? undefined
    : () => {
        setRouteIndexHovered(routeIndex);
      };

  const onMouseLeave = isMobileMode
    ? undefined
    : () => {
        setRouteIndexHovered(null);
      };

  // Edge clamping is done at the RouteNumber level so the badge and its grade
  // stay aligned. Caller passes the final, on-screen coordinates.
  const newX = x;
  const newY = y + RECT_Y_OFFSET;

  const commonProps = {
    cursor: 'pointer',
    pointerEvents: 'none',
    onClick: (e) => {
      if (isEditMode) {
        machine.execute('editRoute', { routeNumber: routeIndex });
      } else {
        machine.execute('routeSelect', { routeNumber: routeIndex });
      }
      e.stopPropagation();
    },
    onMouseEnter,
    onMouseLeave,
  };
  const isSelected = isRouteSelected(routeIndex);

  const colors = useRouteNumberColors({
    isSelected: isSelected || routeIndexHovered === routeIndex,
    hasPathOnThisPhoto: true,
  });

  return (
    <>
      <HoverableRouteName
        x={newX - RECT_WIDTH / 2 - HOVER_WIDTH / 2}
        y={newY - HOVER_WIDTH / 2}
        width={RECT_WIDTH + HOVER_WIDTH}
        height={RECT_HEIGHT + HOVER_WIDTH}
        rx="10"
        fill="transparent"
        {...commonProps}
      />

      <RouteNameOutline
        x={newX - RECT_WIDTH / 2 - OUTLINE_WIDTH / 2}
        y={newY - OUTLINE_WIDTH / 2}
        width={RECT_WIDTH + OUTLINE_WIDTH}
        height={RECT_HEIGHT + OUTLINE_WIDTH}
        rx="10"
        fill={colors.border}
        {...commonProps}
      />
      <RouteNameBox
        x={newX - RECT_WIDTH / 2}
        y={newY}
        width={RECT_WIDTH}
        height={RECT_HEIGHT}
        rx="10"
        fill={colors.background}
        {...commonProps}
      />
      {isTicked(shortId) && (
        <CheckCircle x={newX} y={newY + TEXT_Y_SHIFT} scale={photoZoom.scale} />
      )}
      <Text
        x={newX}
        y={newY + TEXT_Y_SHIFT}
        $scale={photoZoom.scale}
        fill={colors.text}
        textAnchor="middle"
        {...commonProps}
      >
        {routeIndex + 1}
      </Text>
    </>
  );
};

export const RouteNumber = ({ routeIndex }: { routeIndex: number }) => {
  const {
    getPixelPosition,
    getPathForRoute,
    routes,
    photoPath,
    photoZoom,
    imageSize,
  } = useClimbingContext();
  const { userSettings } = useUserSettingsContext();

  const route = routes[routeIndex];
  const path = getPathForRoute(route);
  if (!route || !path || path?.length === 0) return null;

  const { x, y } = getPixelPosition({
    ...path[0],
    units: 'percentage',
  });

  const gradesVisible = userSettings['climbing.isGradesOnPhotosVisible'];
  const hasSiblings = routes.some((other, idx) => {
    if (idx === routeIndex) return false;
    const otherFirst = other?.paths?.[photoPath]?.[0];
    return (
      otherFirst && otherFirst.x === path[0].x && otherFirst.y === path[0].y
    );
  });
  // With siblings the grade sits next to each badge in a tight stack; alone,
  // it sits centered below the badge as before.
  const gradeBeside = hasSiblings && gradesVisible;

  const rowShiftRaw = 22;
  const columnShiftRaw = gradeBeside ? 70 : 22;
  const rowHeight = rowShiftRaw / photoZoom.scale;
  const columnShiftPx = columnShiftRaw / photoZoom.scale;
  const maxRowsPerColumn = Math.max(
    1,
    Math.floor(Math.max(0, imageSize.height - y) / rowHeight),
  );
  // Wrap any extra columns to the left when the start point is too close to
  // the right edge.
  const mirrorLeft = imageSize.width - x < columnShiftPx;

  const shift = getShiftForStartPoint({
    currentRouteSelectedIndex: routeIndex,
    currentPosition: path[0],
    checkedRoutes: routes,
    photoPath,
    maxRowsPerColumn,
    rowShift: rowShiftRaw,
    columnShift: columnShiftRaw,
  });
  const shiftX = (mirrorLeft ? -shift.x : shift.x) / photoZoom.scale;
  const shiftY = shift.y / photoZoom.scale;

  let badgeX = x + shiftX;
  let badgeY = y + shiftY;

  const shortId = route.feature?.osmMeta
    ? getShortId(route.feature.osmMeta)
    : null;

  const digits = String(routeIndex).length;
  const rectWidth = ((digits > 2 ? digits : 0) * 3 + 18) / photoZoom.scale;
  const gradeGap = 6 / photoZoom.scale;
  const gradeHalfWidth = 20 / photoZoom.scale;

  const difficultyProps = gradeBeside
    ? {
        x: mirrorLeft
          ? badgeX - rectWidth / 2 - gradeGap
          : badgeX + rectWidth / 2 + gradeGap,
        y: badgeY + 21 / photoZoom.scale,
        textAnchor: (mirrorLeft ? 'end' : 'start') as 'start' | 'end',
      }
    : {
        x: badgeX,
        y: badgeY + 40 / photoZoom.scale,
        textAnchor: (imageSize.width - badgeX < gradeHalfWidth
          ? 'end'
          : 'middle') as 'middle' | 'end',
      };

  // Compute the combined badge + grade bounding box and shift everything by a
  // single delta if it spills off any image edge. This keeps the badge and its
  // grade visually attached even when their start point sits near the corner.
  const outlinePad = 2 / photoZoom.scale;
  const rectHeight = 18 / photoZoom.scale;
  const rectYOffset = 8 / photoZoom.scale;
  const gradeFullWidth = 40 / photoZoom.scale;
  const gradeAscent = 11 / photoZoom.scale;
  const gradeDescent = 3 / photoZoom.scale;

  let boundLeft = badgeX - rectWidth / 2 - outlinePad;
  let boundRight = badgeX + rectWidth / 2 + outlinePad;
  let boundTop = badgeY + rectYOffset - outlinePad;
  let boundBottom = badgeY + rectYOffset + rectHeight + outlinePad;

  if (gradesVisible) {
    const gradeLeftEdge =
      difficultyProps.textAnchor === 'start'
        ? difficultyProps.x
        : difficultyProps.textAnchor === 'end'
          ? difficultyProps.x - gradeFullWidth
          : difficultyProps.x - gradeFullWidth / 2;
    const gradeRightEdge = gradeLeftEdge + gradeFullWidth;
    const gradeTopEdge = difficultyProps.y - gradeAscent;
    const gradeBottomEdge = difficultyProps.y + gradeDescent;
    boundLeft = Math.min(boundLeft, gradeLeftEdge);
    boundRight = Math.max(boundRight, gradeRightEdge);
    boundTop = Math.min(boundTop, gradeTopEdge);
    boundBottom = Math.max(boundBottom, gradeBottomEdge);
  }

  let dx = 0;
  let dy = 0;
  if (boundLeft < 0) dx = -boundLeft;
  else if (boundRight > imageSize.width) dx = imageSize.width - boundRight;
  if (boundTop < 0) dy = -boundTop;
  else if (boundBottom > imageSize.height) dy = imageSize.height - boundBottom;

  badgeX += dx;
  badgeY += dy;
  const difficultyX = difficultyProps.x + dx;
  const difficultyY = difficultyProps.y + dy;

  return (
    <>
      <RouteNumberBadge
        routeIndex={routeIndex}
        x={badgeX}
        y={badgeY}
        shortId={shortId}
      />
      {gradesVisible && (
        <RouteDifficulty
          x={difficultyX}
          y={difficultyY}
          textAnchor={difficultyProps.textAnchor}
          route={route}
        />
      )}
    </>
  );
};

import { useTheme } from '@mui/material';
import {
  getDifficulty,
  getDifficultyColor,
} from '../../../../services/tagging/climbing/routeGrade';
import { useMobileMode } from '../../../helpers';
import { useConfig } from '../config';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { PathPoints } from '../types';
import { RouteLine } from './RouteLine';

type Props = {
  path: PathPoints;
  routeIndex: number;
  opacity?: number;
};

export const PathWithBorder = ({ path, routeIndex, opacity }: Props) => {
  const isMobileMode = useMobileMode();
  const config = useConfig();
  const theme = useTheme();
  const {
    routeIndexHovered,
    isOtherRouteSelected,
    isEditMode,
    routes,
    isRouteSelected,
    getPixelPosition,
    isPointMoving,
    isProtectionPointMoving,
  } = useClimbingContext();

  const pathPx = path.map(getPixelPosition);

  const route = routes[routeIndex];
  const isSelected = isRouteSelected(routeIndex);

  const strokeColor = getDifficultyColor(
    getDifficulty(route.feature.tags),
    theme.palette.mode,
  );

  const contrastColor = theme.palette.getContrastText(
    isSelected ? config.pathStrokeColorSelected : strokeColor,
  );
  const isOtherSelected = isOtherRouteSelected(routeIndex);
  // While dragging a point the pointer flickers on/off the line, which would
  // otherwise make the hover colour/width flash. Keep the stable look instead.
  const isDragging = isPointMoving || isProtectionPointMoving;
  const isHovered =
    !isMobileMode && routeIndexHovered === routeIndex && !isDragging;

  // On hover we only change the route's outline (border) — width and colour —
  // and keep the inner route stroke (its difficulty colour) untouched.
  // Purely visual lines (drawn route + the extend preview). They must not
  // intercept pointer taps, otherwise the preview line that follows the cursor
  // would steal every add-point tap. Interaction lives on InteractivePath.
  return (
    <>
      <RouteLine
        pathPx={pathPx}
        strokeWidth={
          isHovered
            ? config.pathHoverWidth
            : isOtherSelected
              ? 2
              : isSelected
                ? config.pathBorderWidthSelected
                : config.pathBorderWidth
        }
        stroke={isHovered ? config.pathStrokeColorSelected : contrastColor}
        opacity={opacity ? opacity : isOtherSelected && !isHovered ? 0 : 1}
        pointerEvents="none"
      />
      <RouteLine
        pathPx={pathPx}
        strokeWidth={isOtherSelected ? 1.3 : config.pathStrokeWidth}
        stroke={isOtherSelected ? 'white' : strokeColor}
        opacity={
          opacity ? opacity : isOtherSelected ? (isEditMode ? 1 : 0.6) : 1
        }
        pointerEvents="none"
      />
    </>
  );
};

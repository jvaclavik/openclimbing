import { useTheme } from '@mui/material';
import { useClimbingContext } from './contexts/ClimbingContext';

export const useConfig = () => {
  const theme: any = useTheme();
  const { photoZoom, imageSize } = useClimbingContext();

  const activeColor = theme.palette.climbing.active;
  const inactiveColor = theme.palette.climbing.inactive;
  const borderColor = theme.palette.climbing.border;
  const selectedColor = theme.palette.climbing.selected;

  const imageScale = Math.max(
    0.5,
    Math.min(1, ((imageSize.width - 150) / (1400 - 150)) * 0.5 + 0.5),
  );

  return {
    pathBorderColor: borderColor,
    pathBorderColorSelected: inactiveColor,
    pathStrokeColor: inactiveColor,
    pathStrokeColorSelected: selectedColor,

    anchorColor: inactiveColor,
    anchorColorSelected: activeColor,
    anchorBorderColor: borderColor,
    anchorBorderColorSelected: inactiveColor,

    pathBorderWidth: (6.2 / photoZoom.scale) * imageScale,
    // Thicker outer outline for the currently selected route so it visually
    // pops out over the rest of the routes — same inner stroke, wider border.
    pathBorderWidthSelected: (8.2 / photoZoom.scale) * imageScale,
    pathBorderOpacity: 1,
    pathStrokeWidth: (4.4 / photoZoom.scale) * imageScale,
    // Hover highlight is drawn on top of the route stroke; making it a bit
    // wider lets the semi-transparent colour form a halo/border around the
    // route on mouse hover (photo + route list row).
    pathHoverWidth: (8.5 / photoZoom.scale) * imageScale,
  };
};

export const CLIMBING_ROUTE_ROW_HEIGHT = 50;
export const DIALOG_TOP_BAR_HEIGHT = 56;

export const getSplitPaneDefaultSize = (layout: 'horizontal' | 'vertical') =>
  layout === 'vertical' ? '70vw' : '70vh';

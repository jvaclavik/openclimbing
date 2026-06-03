import { useExtraPalette } from '../../../../helpers/extraPalette';

type RouteNumberColorsParams = {
  isSelected?: boolean;
  hasPathOnThisPhoto?: boolean;
  isOnThisPhoto?: boolean;
  hasPathInDifferentPhoto?: boolean;
  isOnDifferentPhoto?: boolean;
};

export const useRouteNumberColors = ({
  isSelected,
  hasPathOnThisPhoto,
  isOnThisPhoto,
  hasPathInDifferentPhoto,
  isOnDifferentPhoto,
}: RouteNumberColorsParams) => {
  const { routeNumber } = useExtraPalette();

  if (hasPathOnThisPhoto && isSelected) {
    return {
      background: routeNumber.text,
      text: routeNumber.background,
      border: `solid 1px ${routeNumber.text}`,
    };
  }
  if (hasPathOnThisPhoto) {
    return {
      background: routeNumber.background,
      text: routeNumber.text,
      border: `solid 1px ${routeNumber.background}`,
    };
  }
  if (isOnThisPhoto) {
    return {
      background: routeNumber.background,
      text: routeNumber.text,
      border: `dashed 1px ${routeNumber.border}`,
    };
  }
  if (hasPathInDifferentPhoto) {
    return {
      background: 'transparent',
      text: routeNumber.text,
      border: `solid 1px ${routeNumber.border}`,
    };
  }
  if (isOnDifferentPhoto) {
    return {
      background: 'transparent',
      text: routeNumber.text,
      border: `dashed 1px ${routeNumber.border}`,
    };
  }

  return {
    background: 'transparent',
    text: routeNumber.text,
    border: 'solid 1px transparent',
  };
};

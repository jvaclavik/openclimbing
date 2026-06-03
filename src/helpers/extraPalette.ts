import { Theme, useUserThemeContext } from './theme';

export type ExtraPalette = {
  invertFilter: string;
  searchBox: string;
  searchInput: string;
  searchInputSolid: string;
  searchInputPanel: string;
  routeNumber: {
    background: string;
    text: string;
    border: string;
  };
  tickBadge: string;
  // @TODO following colors should be deleted in the future
  climbingPath: {
    active: string;
    inactive: string;
    border: string;
    selected: string;
  };
};

const lightPalette: ExtraPalette = {
  invertFilter: 'invert(0)',
  searchBox: '#eb5757',
  searchInput: 'rgba(255,255,255,0.6)',
  searchInputSolid: 'rgb(249, 248, 244)',
  searchInputPanel: 'rgba(255,255,255,0.8)',
  routeNumber: {
    background: '#D1D1D1',
    text: '#202020',
    border: '#666',
  },
  tickBadge: '#F2EFCB',
  climbingPath: {
    active: '#00854dff',
    inactive: '#f6f6f6',
    border: '#555555ff',
    selected: '#000000',
  },
};

const darkPalette: ExtraPalette = {
  invertFilter: 'invert(1)',
  searchBox: '#963838',
  searchInput: 'rgba(0,0,0,0.5)',
  searchInputSolid: 'rgb(35, 26, 26)',
  searchInputPanel: 'rgba(0,0,0,0.7)',
  routeNumber: {
    background: '#000000',
    text: '#ffffff',
    border: '#666',
  },
  tickBadge: '#5B5C50',
  climbingPath: {
    active: '#2fbc81ff',
    inactive: '#0a0a0aff',
    border: '#ffffffff',
    selected: '#ffffff',
  },
};

export const extraPalette: Record<Theme, ExtraPalette> = {
  light: lightPalette,
  dark: darkPalette,
};

export const useExtraPalette = (): ExtraPalette => {
  const { currentTheme } = useUserThemeContext();
  return extraPalette[currentTheme];
};

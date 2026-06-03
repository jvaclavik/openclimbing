import {
  Palette as MuiPalette,
  PaletteOptions as MuiPaletteOptions,
  TypeBackground as MuiTypeBackground,
} from '@mui/material/styles/createPalette';

import { Theme as MaterialUITheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette extends MuiPalette {}

  interface PaletteOptions extends MuiPaletteOptions {}

  interface TypeBackground extends MuiTypeBackground {
    elevation?: string;
    hover?: string;
  }

  interface Theme {
    palette: Palette;
  }

  interface ThemeOptions {
    palette?: PaletteOptions;
  }
}

declare module '@emotion/react' {
  export interface Theme extends MaterialUITheme {}
}

declare module 'suncalc' {
  export interface SunPositionResult {
    azimuth: number;
    altitude: number;
  }
  export function getPosition(
    date: Date,
    latitude: number,
    longitude: number,
  ): SunPositionResult;
  export function getTimes(
    date: Date,
    latitude: number,
    longitude: number,
  ): Record<string, Date>;
  const SunCalc: {
    getPosition: typeof getPosition;
    getTimes: typeof getTimes;
  };
  export default SunCalc;
}

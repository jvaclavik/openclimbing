import {
  Palette as MuiPalette,
  PaletteOptions as MuiPaletteOptions,
  TypeBackground as MuiTypeBackground,
} from '@mui/material/styles/createPalette';

import { Theme as MaterialUITheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette extends MuiPalette {
    tertiary: Palette['primary'];
    invertFilter: string;
    climbing: {
      primary: string;
      secondary: string;
      tertiary: string;
      tick: string;
      active: string;
      inactive: string;
      border: string;
      selected: string;
    };
  }

  interface PaletteOptions extends MuiPaletteOptions {
    tertiary?: MuiPaletteOptions['primary'];
    invertFilter?: string;
    climbing?: {
      primary: string;
      secondary: string;
      tertiary: string;
      tick: string;
      active: string;
      inactive: string;
      border: string;
      selected: string;
    };
  }

  interface TypeBackground extends MuiTypeBackground {
    elevation?: string;
    hover?: string;
    searchBox?: string;
    searchInput?: string;
    searchInputSolid?: string;
    searchInputPanel?: string;
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

declare module 'jsfive' {
  export class File {
    constructor(buffer: ArrayBuffer, filename?: string);
    keys: string[];
    attrs: Record<string, unknown>;
    get(path: string): {
      value: number[];
      shape?: number[];
      dtype?: string;
      keys?: string[];
      attrs?: Record<string, unknown>;
      get(path: string): unknown;
    } | null;
  }
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

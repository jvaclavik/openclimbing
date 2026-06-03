import { useMediaQuery } from '@mui/material';
import { grey, red } from '@mui/material/colors';
import { createTheme, ThemeOptions, ThemeProvider } from '@mui/material/styles';
import Cookies from 'js-cookie';
import { createContext, useContext, useMemo, useState } from 'react';
import { Setter } from '../types';

const sharedThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: ['"Outfit"'].join(','),
  },
  shape: {
    borderRadius: '12px',
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        sizeSmall: {
          fontWeight: 500,
          paddingLeft: 8,
          paddingRight: 8,
        },
        sizeMedium: {
          fontWeight: 700,
          paddingLeft: 16,
          paddingRight: 16,
        },
        sizeLarge: {
          fontWeight: 700,
          paddingLeft: 20,
          paddingRight: 20,
        },
        root: {
          textTransform: 'none',
          borderRadius: '20px',
          letterSpacing: -0.1,
          paddingLeft: 8,
          paddingRight: 8,
          lineHeight: 1.6,
        },
      },
    },
  },
};

const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'light',
    divider: 'rgba(0, 0, 0, 0.04)',
    primary: {
      main: '#d84315',
    },
    secondary: {
      main: '#757575',
      contrastText: '#ffffff',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#f6f6f6',
      elevation: '#ddd',
      paper: '#fafafa',
      hover: '#f2f3f2',
    },
  },
});

const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    divider: 'rgba(255, 255, 255, 0.04)',
    primary: {
      main: '#ff7c4d',
    },
    secondary: {
      main: '#ffffff1f',
      contrastText: '#ffffff',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#1a1a1a',
      elevation: '#212121',
      paper: '#242424',
      hover: grey['700'],
    },
  },
});

export type Theme = 'light' | 'dark';
export type UserTheme = 'system' | Theme;

type UserThemeContextType = {
  userTheme: UserTheme;
  setUserTheme: Setter<UserTheme>;
  theme: typeof lightTheme | typeof darkTheme;
  currentTheme: Theme;
};

export const UserThemeContext = createContext<UserThemeContextType>(undefined);

const useGetCurrentTheme = (userTheme: UserTheme) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', {
    defaultMatches: true,
  });

  return useMemo(() => {
    if (userTheme === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return userTheme;
  }, [userTheme, prefersDarkMode]);
};

export const UserThemeProvider = ({ children, userThemeCookie }) => {
  const [userTheme, setUserThemeState] = useState<UserTheme>(
    userThemeCookie ?? 'system',
  );
  const currentTheme = useGetCurrentTheme(userTheme);
  const theme = currentTheme === 'dark' ? darkTheme : lightTheme;

  const setUserTheme = (choice: UserTheme) => {
    setUserThemeState(choice);
    Cookies.set('userTheme', choice, { expires: 30 * 12 * 10, path: '/' });
  };

  const value: UserThemeContextType = {
    userTheme,
    setUserTheme,
    currentTheme,
    theme,
  };
  return (
    <UserThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </UserThemeContext.Provider>
  );
};

export const useUserThemeContext = () => useContext(UserThemeContext);

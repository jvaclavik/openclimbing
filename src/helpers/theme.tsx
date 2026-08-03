import { useMediaQuery } from '@mui/material';
import { grey, red } from '@mui/material/colors';
import { createTheme, ThemeOptions, ThemeProvider } from '@mui/material/styles';
import Cookies from 'js-cookie';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Setter } from '../types';

const sharedThemeOptions: ThemeOptions = {
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 900,
        },
      },
    },
  },
  shape: {
    borderRadius: '12px',
  },
  typography: {
    fontFamily: `"Source Sans 3", "Helvetica", "Arial", sans-serif`,
    fontSize: 14,
    h1: {
      fontFamily: `"Piazzolla", "Helvetica", "Arial", sans-serif`,
      fontWeight: 500,
      fontSize: 55,
      lineHeight: 1,
    },

    h2: {
      fontFamily: `"Piazzolla", "Helvetica", "Arial", sans-serif`,
      fontWeight: 500,
      fontSize: 38,
    },

    h3: {
      fontFamily: `"Piazzolla", "Helvetica", "Arial", sans-serif`,
      fontWeight: 700,
      fontSize: 32,
    },
    h4: {
      fontFamily: `"Piazzolla", "Helvetica", "Arial", sans-serif`,
      fontWeight: 900,
      fontSize: 20,
    },
  },
};

const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    divider: 'rgba(0, 0, 0, 0.04)',
    primary: {
      main: '#ae2f0c',
    },
    secondary: {
      main: '#737373',
    },
    tertiary: {
      main: '#0078a8', // links
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#f6f6f6ff',
      elevation: '#ddd',
      paper: '#fafafa',
      hover: '#f2f3f2',
      searchBox: '#eb5757',
      searchInput: 'rgba(255,255,255,0.6)',
      searchInputSolid: 'rgb(249, 248, 244)',
      searchInputPanel: 'rgba(255,255,255,0.8)',
    },
    invertFilter: 'invert(0)',
    climbing: {
      primary: '#D1D1D1',
      secondary: '#202020',
      tertiary: '#666',
      tick: '#F2EFCB',

      // @TODO: following colors should be deleted in the future
      active: '#00854dff',
      inactive: '#f6f6f6',
      border: '#555555ff',
      selected: '#000000',
    },
  },
});

const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    divider: 'rgba(255, 255, 255, 0.04)',
    primary: {
      main: '#f37553',
    },
    secondary: {
      main: '#ffffff96',
    },
    tertiary: {
      main: '#00b6ff', // links
    },
    error: {
      main: red.A400,
    },

    background: {
      default: '#1a1a1a',
      elevation: '#2e2e2e',
      paper: '#242424',
      hover: grey['700'],
      searchBox: '#963838',
      searchInput: 'rgba(0,0,0,0.5)',
      searchInputSolid: 'rgb(42, 34, 34)',
      searchInputPanel: 'rgba(0,0,0,0.55)',
    },
    invertFilter: 'invert(1)',
    climbing: {
      primary: '#000000',
      secondary: '#fff',
      tertiary: '#666',
      tick: '#5B5C50',

      // @TODO: following colors should be deleted in the future
      active: '#2fbc81ff',
      inactive: '#0a0a0aff',
      border: '#ffffffff',
      selected: '#ffffff',
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

// Alt+T flips between light and dark, never back to 'system'
const useToggleThemeShortcut = (
  currentTheme: Theme,
  setUserTheme: (choice: UserTheme) => void,
) => {
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      // `key` is unusable here - Option+T types '†' on macOS
      if (e.code !== 'KeyT' || !e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }
      e.preventDefault();
      setUserTheme(currentTheme === 'dark' ? 'light' : 'dark');
    };

    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('keydown', onKeydown);
    };
  }, [currentTheme, setUserTheme]);
};

export const UserThemeProvider = ({ children, userThemeCookie }) => {
  const [userTheme, setUserThemeState] = useState<UserTheme>(
    userThemeCookie ?? 'system',
  );
  const currentTheme = useGetCurrentTheme(userTheme);
  const theme = currentTheme === 'dark' ? darkTheme : lightTheme;

  const setUserTheme = useCallback((choice: UserTheme) => {
    setUserThemeState(choice);
    Cookies.set('userTheme', choice, { expires: 30 * 12 * 10, path: '/' });
  }, []);

  useToggleThemeShortcut(currentTheme, setUserTheme);

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

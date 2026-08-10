import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  loginToWikimediaCommons,
  logoutFromWikimediaCommons,
  readWikimediaUserFromCookies,
  resumeWikimediaOAuthIfPending,
  WikimediaCommonsUser,
} from '../../services/wikimedia/auth/session';
import { useSnackbar } from './SnackbarContext';
import { t } from '../../services/intl';

type WikimediaCommonsAuthType = {
  loggedIn: boolean;
  user?: WikimediaCommonsUser;
  loading: boolean;
  handleLogin: () => Promise<WikimediaCommonsUser>;
  handleLogout: () => void;
};

const WikimediaCommonsAuthContext = createContext<
  WikimediaCommonsAuthType | undefined
>(undefined);

type Props = {
  children: React.ReactNode;
  cookies: Record<string, string>;
};

export const WikimediaCommonsAuthProvider: React.FC<Props> = ({
  children,
  cookies,
}) => {
  const [user, setUser] = useState<WikimediaCommonsUser | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { showToast } = useSnackbar();

  // Hydrate from localStorage after mount (SSR has no access). Also finish a
  // standalone-PWA OAuth redirect that landed back on this page.
  useEffect(() => {
    setUser(readWikimediaUserFromCookies(cookies));

    let cancelled = false;
    (async () => {
      try {
        const resumed = await resumeWikimediaOAuthIfPending();
        if (cancelled || !resumed) return;
        setUser(resumed);
        showToast(
          t('wikimedia.logged_in_as', { user: resumed.username }),
          'success',
        );
      } catch (e) {
        if (cancelled) return;
        showToast(
          t('wikimedia.login_failed', { error: String(e?.message ?? e) }),
          'error',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cookies, showToast]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const loggedInUser = await loginToWikimediaCommons();
      setUser(loggedInUser);
      showToast(
        t('wikimedia.logged_in_as', { user: loggedInUser.username }),
        'success',
      );
      return loggedInUser;
    } catch (e) {
      showToast(
        t('wikimedia.login_failed', { error: String(e?.message ?? e) }),
        'error',
      );
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutFromWikimediaCommons();
    setUser(undefined);
    showToast(t('wikimedia.logged_out'), 'info');
  };

  const value: WikimediaCommonsAuthType = {
    loggedIn: !!user,
    user,
    loading,
    handleLogin,
    handleLogout,
  };

  return (
    <WikimediaCommonsAuthContext.Provider value={value}>
      {children}
    </WikimediaCommonsAuthContext.Provider>
  );
};

export const useWikimediaCommonsAuthContext = () => {
  const ctx = useContext(WikimediaCommonsAuthContext);
  if (!ctx) {
    throw new Error(
      'useWikimediaCommonsAuthContext must be used inside WikimediaCommonsAuthProvider',
    );
  }
  return ctx;
};

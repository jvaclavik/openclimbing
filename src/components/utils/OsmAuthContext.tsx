import React, { createContext, useContext, useState } from 'react';
import {
  loginAndfetchOsmUser,
  osmLogout,
  OsmUser,
} from '../../services/osm/auth/user';
import { useSnackbar } from './SnackbarContext';
import { OSM_USER_COOKIE } from '../../services/osm/consts';
import { t } from '../../services/intl';

type OsmAuthType = {
  loggedIn: boolean;
  osmUser: string;
  userImage: string;
  loading: boolean;
  handleLogin: () => void;
  handleLoginAsync: () => Promise<OsmUser>;
  handleLogout: () => void;
};

const useOsmUserState = (cookies) => {
  const initialState = cookies[OSM_USER_COOKIE];
  return useState<OsmUser | undefined>(initialState);
};

export const OsmAuthContext = createContext<OsmAuthType>(undefined);

export const OsmAuthProvider = ({ children, cookies }) => {
  const [loading, setLoading] = useState(false);
  const [osmUser, setOsmUser] = useOsmUserState(cookies);

  const { showToast } = useSnackbar();

  const successfulLogin = (user: OsmUser) => {
    setOsmUser(user);
    showToast(t('osm_auth.logged_in_as', { user: user.name }), 'success');
    setLoading(false);
  };

  const handleLoginAsync = async () => {
    setLoading(true);
    try {
      const user = await loginAndfetchOsmUser();
      successfulLogin(user);
      return user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };
  const handleLogin = () => {
    handleLoginAsync().catch(() => {});
  };
  const handleLogout = () => osmLogout().then(() => setOsmUser(undefined));

  const value: OsmAuthType = {
    loggedIn: !!osmUser,
    osmUser: osmUser?.name || '', // TODO rename
    userImage: osmUser?.imageUrl || '',
    loading,
    handleLogin,
    handleLoginAsync,
    handleLogout,
  };

  return (
    <OsmAuthContext.Provider value={value}>{children}</OsmAuthContext.Provider>
  );
};

export const useOsmAuthContext = () => useContext(OsmAuthContext);

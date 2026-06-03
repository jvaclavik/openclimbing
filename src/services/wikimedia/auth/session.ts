import {
  WIKIMEDIA_CLIENT_ID,
  WIKIMEDIA_OAUTH_PROFILE_URL,
  WIKIMEDIA_OAUTH_TOKEN_URL,
  WIKIMEDIA_TOKEN_COOKIE,
  WIKIMEDIA_USER_COOKIE,
} from '../consts';
import { startWikimediaOAuthFlow } from './oauthFlow';

export type WikimediaCommonsUser = {
  username: string;
  realname?: string;
};

type StoredToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

const isBrowser = () => typeof window !== 'undefined';

const writeToken = (token: StoredToken) => {
  if (!isBrowser()) return;
  localStorage.setItem(WIKIMEDIA_TOKEN_COOKIE, JSON.stringify(token));
};

const readToken = (): StoredToken | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(WIKIMEDIA_TOKEN_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
};

const clearToken = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(WIKIMEDIA_TOKEN_COOKIE);
};

const writeUser = (user: WikimediaCommonsUser) => {
  if (!isBrowser()) return;
  localStorage.setItem(WIKIMEDIA_USER_COOKIE, JSON.stringify(user));
};

const readUser = (): WikimediaCommonsUser | undefined => {
  if (!isBrowser()) return undefined;
  const raw = localStorage.getItem(WIKIMEDIA_USER_COOKIE);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as WikimediaCommonsUser;
  } catch {
    return undefined;
  }
};

export const readWikimediaUserFromCookies = (
  _cookies: Record<string, string>,
): WikimediaCommonsUser | undefined => {
  // Stored client-side in localStorage; SSR has no access. Returns undefined on first render
  // and the context hydrates from localStorage in an effect.
  return readUser();
};

const clearUser = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(WIKIMEDIA_USER_COOKIE);
};

const refreshAccessToken = async (
  refreshToken: string,
): Promise<StoredToken> => {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: WIKIMEDIA_CLIENT_ID,
  });
  const response = await fetch(WIKIMEDIA_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error(`Refresh token failed: ${response.status}`);
  }
  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const stored = readToken();
  if (!stored) return null;

  if (stored.expiresAt - Date.now() > 60_000) {
    return stored.accessToken;
  }

  if (!stored.refreshToken) {
    clearToken();
    clearUser();
    return null;
  }

  try {
    const refreshed = await refreshAccessToken(stored.refreshToken);
    writeToken(refreshed);
    return refreshed.accessToken;
  } catch {
    clearToken();
    clearUser();
    return null;
  }
};

const fetchProfile = async (
  accessToken: string,
): Promise<WikimediaCommonsUser> => {
  const response = await fetch(WIKIMEDIA_OAUTH_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Profile fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as {
    username: string;
    realname?: string;
  };
  return { username: data.username, realname: data.realname };
};

export const loginToWikimediaCommons =
  async (): Promise<WikimediaCommonsUser> => {
    const tokenResponse = await startWikimediaOAuthFlow();
    const stored: StoredToken = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    };
    writeToken(stored);

    const user = await fetchProfile(stored.accessToken);
    writeUser(user);
    return user;
  };

export const logoutFromWikimediaCommons = () => {
  clearToken();
  clearUser();
};

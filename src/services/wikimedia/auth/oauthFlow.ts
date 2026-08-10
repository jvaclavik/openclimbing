import {
  WIKIMEDIA_CLIENT_ID,
  WIKIMEDIA_OAUTH_AUTHORIZE_URL,
  WIKIMEDIA_OAUTH_BROADCAST_CHANNEL,
  WIKIMEDIA_OAUTH_TOKEN_URL,
} from '../consts';
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from './pkce';
import { isAndroid, isIOS } from '../../../helpers/platforms';

const PKCE_STORAGE_KEY = 'wikimediaPkce';
const RETURN_STORAGE_KEY = 'wikimediaOAuthReturn';
const CALLBACK_STORAGE_KEY = 'wikimediaOAuthCallbackUrl';
export const EDIT_DIALOG_RESUME_KEY = 'editDialogResume';

type PkceState = {
  verifier: string;
  state: string;
  redirectUri: string;
};

type OAuthReturnState = {
  url: string;
  reopenEdit?: boolean;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
};

const isBrowser = () => typeof window !== 'undefined';

/** Home-screen PWA (iOS/Android) – popups are unreliable or blocked. */
export const isStandalonePwa = () => {
  if (!isBrowser()) return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
};

/** Mobile Safari/Chrome block or mishandle OAuth popups – use full-page redirect. */
const shouldUseRedirectOAuth = () =>
  isStandalonePwa() || isIOS() || isAndroid();

const storePkceState = (state: PkceState) => {
  localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(state));
};

const readPkceState = (): PkceState | null => {
  const raw = localStorage.getItem(PKCE_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PkceState) : null;
};

const clearPkceState = () => {
  localStorage.removeItem(PKCE_STORAGE_KEY);
};

const getRedirectUri = () =>
  `${window.location.origin}/wikimedia-oauth-token.html`;

const buildAuthorizeUrl = async () => {
  if (!WIKIMEDIA_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_WIKIMEDIA_CLIENT_ID is not set');
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();
  const redirectUri = getRedirectUri();

  storePkceState({ verifier, state, redirectUri });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: WIKIMEDIA_CLIENT_ID,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  return `${WIKIMEDIA_OAUTH_AUTHORIZE_URL}?${params}`;
};

const exchangeCodeForToken = async (
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<TokenResponse> => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: WIKIMEDIA_CLIENT_ID,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch(WIKIMEDIA_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  return response.json();
};

const waitForCallback = (state: string): Promise<URL> =>
  new Promise((resolve, reject) => {
    const channel = new BroadcastChannel(WIKIMEDIA_OAUTH_BROADCAST_CHANNEL);
    const timeoutId = window.setTimeout(
      () => {
        channel.close();
        reject(new Error('Wikimedia Commons OAuth timed out'));
      },
      5 * 60 * 1000,
    );

    channel.onmessage = (event) => {
      try {
        const url = new URL(event.data);
        const returnedState = url.searchParams.get('state');
        if (returnedState !== state) return;
        window.clearTimeout(timeoutId);
        channel.close();
        const error = url.searchParams.get('error');
        if (error) {
          reject(
            new Error(
              `${error}: ${url.searchParams.get('error_description') ?? ''}`,
            ),
          );
          return;
        }
        resolve(url);
      } catch (e) {
        reject(e);
      }
    };
  });

/** Persist that Edit dialog should reopen after OAuth / photo-picker resume. */
export const markEditDialogForResume = () => {
  if (!isBrowser()) return;
  localStorage.setItem(
    EDIT_DIALOG_RESUME_KEY,
    JSON.stringify({ path: window.location.pathname, ts: Date.now() }),
  );
};

export const consumeEditDialogResume = (): boolean => {
  if (!isBrowser()) return false;
  const raw = localStorage.getItem(EDIT_DIALOG_RESUME_KEY);
  if (!raw) return false;
  localStorage.removeItem(EDIT_DIALOG_RESUME_KEY);
  try {
    const data = JSON.parse(raw) as { path?: string; ts?: number };
    if (!data.path || !data.ts) return false;
    if (Date.now() - data.ts > 30 * 60 * 1000) return false;
    return data.path === window.location.pathname;
  } catch {
    return false;
  }
};

const finishWithCallbackUrl = async (
  callbackHref: string,
): Promise<TokenResponse> => {
  const pkce = readPkceState();
  if (!pkce) throw new Error('Missing Wikimedia OAuth PKCE state');

  const callbackUrl = new URL(callbackHref);
  const returnedState = callbackUrl.searchParams.get('state');
  if (returnedState !== pkce.state) {
    throw new Error('Wikimedia OAuth state mismatch');
  }
  const error = callbackUrl.searchParams.get('error');
  if (error) {
    throw new Error(
      `${error}: ${callbackUrl.searchParams.get('error_description') ?? ''}`,
    );
  }
  const code = callbackUrl.searchParams.get('code');
  if (!code) throw new Error('Authorization code missing in callback');

  try {
    return await exchangeCodeForToken(code, pkce.verifier, pkce.redirectUri);
  } finally {
    clearPkceState();
    localStorage.removeItem(RETURN_STORAGE_KEY);
    localStorage.removeItem(CALLBACK_STORAGE_KEY);
  }
};

/**
 * After a full-page OAuth redirect (standalone PWA), the callback page stores
 * the result URL and sends the user back. Call this on app boot to finish login.
 */
export const completePendingWikimediaOAuth =
  async (): Promise<TokenResponse | null> => {
    if (!isBrowser()) return null;
    const callbackHref = localStorage.getItem(CALLBACK_STORAGE_KEY);
    if (!callbackHref) return null;
    return finishWithCallbackUrl(callbackHref);
  };

/**
 * Starts Wikimedia OAuth. On mobile / standalone PWA uses a full-page redirect
 * (popups are blocked or unreliable). On desktop keeps a popup. For redirect
 * the page navigates away and this promise never settles.
 */
export const startWikimediaOAuthFlow = async (): Promise<TokenResponse> => {
  const authorizeUrl = await buildAuthorizeUrl();
  const pkce = readPkceState();
  if (!pkce) throw new Error('Failed to initialize Wikimedia OAuth');

  if (shouldUseRedirectOAuth()) {
    markEditDialogForResume();
    localStorage.setItem(
      RETURN_STORAGE_KEY,
      JSON.stringify({
        url: window.location.href,
        reopenEdit: true,
      } satisfies OAuthReturnState),
    );
    window.location.assign(authorizeUrl);
    // Page is navigating away – keep the promise pending so callers don't
    // treat navigation as a failed login.
    return new Promise<TokenResponse>(() => {});
  }

  const popup = window.open(
    authorizeUrl,
    'wikimedia-oauth',
    'width=600,height=720',
  );
  if (!popup) {
    clearPkceState();
    throw new Error(
      'Pop-up was blocked. Please allow pop-ups for this site to sign in to Wikimedia Commons.',
    );
  }

  try {
    const callbackUrl = await waitForCallback(pkce.state);
    const code = callbackUrl.searchParams.get('code');
    if (!code) throw new Error('Authorization code missing in callback');
    return await exchangeCodeForToken(code, pkce.verifier, pkce.redirectUri);
  } finally {
    clearPkceState();
  }
};

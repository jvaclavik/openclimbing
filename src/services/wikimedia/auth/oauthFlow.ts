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

const PKCE_STORAGE_KEY = 'wikimediaPkce';

type PkceState = {
  verifier: string;
  state: string;
  redirectUri: string;
};

const storePkceState = (state: PkceState) => {
  sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify(state));
};

const readPkceState = (): PkceState | null => {
  const raw = sessionStorage.getItem(PKCE_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PkceState) : null;
};

const clearPkceState = () => {
  sessionStorage.removeItem(PKCE_STORAGE_KEY);
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

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
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

export const startWikimediaOAuthFlow = async (): Promise<TokenResponse> => {
  const authorizeUrl = await buildAuthorizeUrl();
  const pkce = readPkceState();
  if (!pkce) throw new Error('Failed to initialize Wikimedia OAuth');

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

export const WIKIMEDIA_OAUTH_AUTHORIZE_URL =
  'https://meta.wikimedia.org/w/rest.php/oauth2/authorize';

export const WIKIMEDIA_OAUTH_TOKEN_URL =
  'https://meta.wikimedia.org/w/rest.php/oauth2/access_token';

export const WIKIMEDIA_OAUTH_PROFILE_URL =
  'https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile';

/**
 * The browser calls the Wikimedia Commons Action API directly — no server proxy.
 * This means uploads use the logged-in user's own IP (our server IP is banned on
 * Commons) and are not subject to any serverless body-size limit.
 *
 * CORS: authenticated requests (CSRF token, upload) must pass the `crossorigin`
 * query parameter together with an `Authorization: Bearer` header and no cookies;
 * anonymous reads (category search, filename availability) pass `origin=*`.
 * Requires MediaWiki ≥ 1.44 (Wikimedia runs latest).
 * See https://www.mediawiki.org/wiki/API:Cross-site_requests
 */
export const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

export const WIKIMEDIA_CLIENT_ID =
  process.env.NEXT_PUBLIC_WIKIMEDIA_CLIENT_ID ?? '';

export const WIKIMEDIA_USER_COOKIE = 'wmCommonsUser';
export const WIKIMEDIA_TOKEN_COOKIE = 'wmCommonsToken';

export const WIKIMEDIA_OAUTH_BROADCAST_CHANNEL =
  'wikimedia-commons-auth-complete';

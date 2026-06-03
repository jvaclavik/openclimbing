export const WIKIMEDIA_OAUTH_AUTHORIZE_URL =
  'https://meta.wikimedia.org/w/rest.php/oauth2/authorize';

export const WIKIMEDIA_OAUTH_TOKEN_URL =
  'https://meta.wikimedia.org/w/rest.php/oauth2/access_token';

export const WIKIMEDIA_OAUTH_PROFILE_URL =
  'https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile';

export const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

export const WIKIMEDIA_CLIENT_ID =
  process.env.NEXT_PUBLIC_WIKIMEDIA_CLIENT_ID ?? '';

export const WIKIMEDIA_USER_COOKIE = 'wmCommonsUser';
export const WIKIMEDIA_TOKEN_COOKIE = 'wmCommonsToken';

export const WIKIMEDIA_OAUTH_BROADCAST_CHANNEL =
  'wikimedia-commons-auth-complete';

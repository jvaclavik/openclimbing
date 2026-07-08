import { COMMONS_API_URL } from './consts';
import { getValidAccessToken } from './auth/session';

type ApiError = { code: string; info: string };

const throwIfApiError = (data: unknown, context: string) => {
  const error = (data as { error?: ApiError } | null | undefined)?.error;
  if (error) {
    throw new Error(`Commons ${context}: ${error.code} – ${error.info}`);
  }
};

const apiGet = async <T>(params: Record<string, string>): Promise<T> => {
  const accessToken = await getValidAccessToken();
  const query = new URLSearchParams({
    ...params,
    format: 'json',
    formatversion: '2',
    // CORS: authenticated requests use `crossorigin` + Bearer header; anonymous
    // reads use `origin=*`. See API:Cross-site_requests.
    ...(accessToken ? { crossorigin: '' } : { origin: '*' }),
  });
  const response = await fetch(`${COMMONS_API_URL}?${query}`, {
    credentials: 'omit',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Commons API error ${response.status}: ${text}`);
  }
  const data = await response.json();
  throwIfApiError(data, `${params.action}/${params.meta ?? params.list ?? ''}`);
  return data as T;
};

type CsrfTokenResponse = {
  query: { tokens: { csrftoken: string } };
};

export const getCsrfToken = async (): Promise<string> => {
  const data = await apiGet<CsrfTokenResponse>({
    action: 'query',
    meta: 'tokens',
    type: 'csrf',
  });
  return data.query.tokens.csrftoken;
};

type UploadResult = {
  upload?: {
    result: 'Success' | 'Warning' | string;
    filename?: string;
    warnings?: Record<string, unknown>;
    imageinfo?: {
      descriptionurl?: string;
      canonicaltitle?: string;
    };
  };
  error?: { code: string; info: string };
};

export type UploadProgressEvent = {
  loaded: number;
  total: number;
};

// Warnings that mean "a file already occupies this name" — retrying with a
// different filename (e.g. a numeric suffix) can succeed. `exists-normalized`
// fires when a file with the same name but different extension case/spelling
// exists (e.g. `Foo.JPG`/`Foo.jpeg`), which the exact-title availability check
// can't catch beforehand.
const FILENAME_COLLISION_WARNING_KEYS = new Set([
  'exists',
  'exists-normalized',
  'page-exists',
]);

// Renaming can't help these — the exact file content is already on Commons.
const NON_RETRYABLE_WARNING_KEYS = new Set(['duplicate', 'duplicate-archive']);

export class CommonsUploadWarningError extends Error {
  readonly warningKeys: string[];

  constructor(message: string, warningKeys: string[]) {
    super(message);
    this.name = 'CommonsUploadWarningError';
    this.warningKeys = warningKeys;
  }

  /** True when the only issue is a name clash that a rename could resolve. */
  get isFilenameCollision(): boolean {
    if (this.warningKeys.some((k) => NON_RETRYABLE_WARNING_KEYS.has(k))) {
      return false;
    }
    return this.warningKeys.some((k) => FILENAME_COLLISION_WARNING_KEYS.has(k));
  }
}

type UploadArgs = {
  file: Blob;
  filename: string;
  text: string;
  comment: string;
  ignoreWarnings?: boolean;
  onProgress?: (progress: UploadProgressEvent) => void;
};

const uploadViaXhr = (
  formData: FormData,
  accessToken: string,
  onProgress?: (progress: UploadProgressEvent) => void,
): Promise<UploadResult> =>
  new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Authenticated CORS write straight to Commons: `crossorigin` in the query
    // string + Bearer header, no cookies. The file streams from the browser, so
    // it uses the user's IP and isn't capped by any serverless body-size limit.
    xhr.open('POST', `${COMMONS_API_URL}?crossorigin=`, true);
    xhr.withCredentials = false;
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress({ loaded: e.loaded, total: e.total });
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as UploadResult;
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    xhr.onerror = () =>
      reject(new Error('Network error during upload to Wikimedia Commons'));

    xhr.send(formData);
  });

export const uploadFile = async ({
  file,
  filename,
  text,
  comment,
  ignoreWarnings = false,
  onProgress,
}: UploadArgs): Promise<UploadResult> => {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('Not logged in to Wikimedia Commons');
  }

  const token = await getCsrfToken();

  const formData = new FormData();
  formData.append('action', 'upload');
  formData.append('format', 'json');
  formData.append('formatversion', '2');
  formData.append('filename', filename);
  formData.append('comment', comment);
  formData.append('text', text);
  formData.append('token', token);
  formData.append('file', file, filename);
  if (ignoreWarnings) {
    formData.append('ignorewarnings', '1');
  }

  const result = await uploadViaXhr(formData, accessToken, onProgress);

  if (result.error) {
    throw new Error(
      `Wikimedia Commons upload failed: ${result.error.code} – ${result.error.info}`,
    );
  }
  if (result.upload?.result !== 'Success') {
    const warningKeys = Object.keys(result.upload?.warnings ?? {});
    throw new CommonsUploadWarningError(
      `Wikimedia Commons upload not successful: ${result.upload?.result}${
        warningKeys.length ? ` (warnings: ${warningKeys.join(', ')})` : ''
      }`,
      warningKeys,
    );
  }
  return result;
};

type CategorySearchResponse = {
  query?: {
    allcategories?: { category: string }[];
  };
};

export const findExistingCategory = async (
  candidates: string[],
): Promise<string | null> => {
  for (const candidate of candidates) {
    const data = await apiGet<CategorySearchResponse>({
      action: 'query',
      list: 'allcategories',
      acprefix: candidate,
      aclimit: '5',
    });
    const exact = (data.query?.allcategories ?? []).find(
      (c) => c.category === candidate,
    );
    if (exact) return candidate;
  }
  return null;
};

type PrefixSearchResponse = {
  query?: {
    prefixsearch?: { ns: number; title: string }[];
  };
};

/**
 * Searches Wikimedia Commons categories by prefix. Uses prefixsearch which is
 * case-insensitive (unlike allcategories), so "climbing in spa" finds
 * "Climbing in Spain". Returns canonical category names without the
 * "Category:" namespace prefix.
 */
export const searchCategoryPrefix = async (
  prefix: string,
  limit = 10,
): Promise<string[]> => {
  const trimmed = prefix.trim();
  if (!trimmed) return [];
  const data = await apiGet<PrefixSearchResponse>({
    action: 'query',
    list: 'prefixsearch',
    pssearch: trimmed,
    psnamespace: '14', // Category
    pslimit: String(limit),
  });
  return (data.query?.prefixsearch ?? []).map((entry) =>
    entry.title.replace(/^Category:/, ''),
  );
};

type TitleAvailabilityResponse = {
  query: {
    pages: { missing?: boolean; title: string }[];
  };
};

export const isTitleAvailable = async (title: string): Promise<boolean> => {
  const data = await apiGet<TitleAvailabilityResponse>({
    action: 'query',
    titles: title,
  });
  return Boolean(data.query.pages[0]?.missing);
};

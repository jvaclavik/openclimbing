import { fetchJson } from '../../services/fetch';

const API = 'https://commons.wikimedia.org/w/api.php';
const BATCH_SIZE = 50; // API limit for `titles`

type ImageInfoResponse = {
  query?: {
    pages?: {
      title: string;
      missing?: boolean;
      imageinfo?: { width: number; height: number }[];
    }[];
  };
};

// Commons treats spaces and underscores in titles as equal and answers with
// spaces, while OSM tags use both.
const normalize = (file: string) =>
  file
    .replace(/^File:/, '')
    .replace(/_/g, ' ')
    .trim();

// Photo dimensions never change, so one lookup per file per process is enough.
// `null` means Commons doesn't know the file (deleted/renamed) - cached too, so
// we don't ask again.
const store = global as unknown as {
  commonsRatios?: Map<string, number | null>;
};
const getCache = () => {
  store.commonsRatios ??= new Map();
  return store.commonsRatios;
};

const fetchBatch = async (files: string[]) => {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'imageinfo',
    iiprop: 'dimensions',
    titles: files.join('|'),
  });

  const response = await fetchJson<ImageInfoResponse>(`${API}?${params}`);
  const cache = getCache();

  for (const page of response.query?.pages ?? []) {
    const { width, height } = page.imageinfo?.[0] ?? {};
    cache.set(
      normalize(page.title),
      width > 0 && height > 0 ? width / height : null,
    );
  }
};

/**
 * Aspect ratios (width / height) of Wikimedia Commons photos, keyed by the
 * normalized file name. The gallery ships them together with the data so the
 * masonry layout knows every tile's height before the photos start loading.
 */
export const getCommonsImageRatios = async (files: string[]) => {
  const cache = getCache();
  const missing = [...new Set(files.map(normalize))].filter(
    (file) => !cache.has(file),
  );

  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    batches.push(missing.slice(i, i + BATCH_SIZE).map((f) => `File:${f}`));
  }
  await Promise.all(batches.map(fetchBatch));

  return (file: string) => cache.get(normalize(file));
};

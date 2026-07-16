import {
  getIndexableFeatureCount,
  getIndexableFeatures,
  getOsmDataTimestamp,
  SITEMAP_CHUNK_SIZE,
} from './getSitemapData';

// Public content pages worth indexing besides the OSM feature detail pages.
const STATIC_PATHS = [
  '',
  '/climbing-areas',
  '/climbing-grades',
  '/climbing-leaderboard',
  '/tick-scoring',
];

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });

const imageTag = (loc: string) =>
  `<image:image><image:loc>${escapeXml(loc)}</image:loc></image:image>`;

const urlTag = (loc: string, lastmod?: string | null, images: string[] = []) =>
  `<url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}${images.map(imageTag).join('')}</url>`;

const wrapUrlset = (body: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`;

const getChunkCount = (): number => {
  try {
    const count = getIndexableFeatureCount();
    return Math.ceil(count / SITEMAP_CHUNK_SIZE);
  } catch {
    // e.g. Vercel preview without the SQLite DB - fall back to static-only index
    return 0;
  }
};

export const buildSitemapIndex = (baseUrl: string): string => {
  const lastmod = new Date().toISOString();
  const children = [`${baseUrl}/sitemaps/static.xml`];
  for (let i = 0; i < getChunkCount(); i += 1) {
    children.push(`${baseUrl}/sitemaps/features-${i}.xml`);
  }

  const body = children
    .map(
      (loc) =>
        `<sitemap><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></sitemap>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
};

export const buildStaticSitemap = (baseUrl: string): string => {
  const body = STATIC_PATHS.map((path) => urlTag(`${baseUrl}${path}`)).join('');
  return wrapUrlset(body);
};

export const buildFeatureSitemap = (baseUrl: string, chunk: number): string => {
  let body = '';
  try {
    const lastmod = getOsmDataTimestamp();
    const features = getIndexableFeatures(
      SITEMAP_CHUNK_SIZE,
      chunk * SITEMAP_CHUNK_SIZE,
    );
    body = features
      .map(({ osmType, osmId, images }) =>
        urlTag(`${baseUrl}/${osmType}/${osmId}`, lastmod, images),
      )
      .join('');
  } catch {
    body = '';
  }
  return wrapUrlset(body);
};

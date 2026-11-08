export type ViaFerrataReview = {
  title: string;
  stars: number;
  author: string;
  date: string;
  text: string;
  url: string;
};

export type ViaFerrataBlock = { kind: 'h2' | 'p'; text: string };

export type ViaFerrataRatings = {
  slug: string;
  name: string;
  difficulty: string;
  duration: string;
  description: ViaFerrataBlock[];
  images: string[];
  average: number;
  count: number;
  lat: number | null;
  lng: number | null;
  url: string;
  reviews_url: string;
  reviews: ViaFerrataReview[];
};

const SITEMAP = 'https://www.via-ferrata.de/klettersteige/sitemap.xml';
const TOPO = 'https://www.via-ferrata.de/klettersteige/topo/';

const textOf = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/\u0026nbsp;/g, ' ')
    .replace(/\u0026amp;/g, '\u0026')
    .replace(/\u0026quot;/g, '"')
    .replace(/\u0026#0?39;|\u0026apos;/g, "'")
    .replace(/\u0026lt;/g, '<')
    .replace(/\u0026gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const clip = (value: string, max = 500) =>
  value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;

export const climbKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '');

export const isClimbSlug = (slug: string) =>
  /^[a-z0-9-]{3,160}(?:%[0-9a-f]{2}[a-z0-9-]*)*$/i.test(slug) &&
  slug.length <= 200 &&
  !/%2e|%2f|%5c/i.test(slug);

export const parseClimbSlugs = (xml: string) => [
  ...new Set(
    [...xml.matchAll(/\/topo\/([^<\s"]+)/g)]
      .map((match) => match[1].replace(/\/+$/, ''))
      .filter(isClimbSlug),
  ),
];

export const matchClimbSlug = (name: string, slugs: string[]) => {
  const key = climbKey(name);
  const stripped = key
    .replace(/klettersteig/g, '')
    .replace(/viaferrata/g, '')
    .replace(/ferrata/g, '');
  let best: { slug: string; score: number } | null = null;
  slugs.forEach((slug) => {
    const plain = slug.replace(/-/g, '');
    let score = 0;
    if (plain === key || (stripped.length >= 5 && plain === stripped))
      score = 100;
    else if (stripped.length >= 6 && plain.startsWith(stripped)) score = 80;
    else if (stripped.length >= 8 && plain.includes(stripped)) score = 60;
    else if (key.length >= 8 && plain.includes(key)) score = 50;
    if (
      score > 0 &&
      (!best ||
        score > best.score ||
        (score === best.score && slug.length < best.slug.length))
    )
      best = { slug, score };
  });
  return best && best.score >= 50 ? best.slug : null;
};

const listingPart = (html: string) =>
  html.split('sabai-directory-review-title')[0] ?? html;

const readDescription = (html: string): ViaFerrataBlock[] => {
  const raw =
    listingPart(html).match(/itemprop="description">([\s\S]*?)<\/div>/)?.[1] ??
    '';
  const blocks = [...raw.matchAll(/<(h2|h3|p)\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((match) => ({
      kind: (match[1] === 'p' ? 'p' : 'h2') as ViaFerrataBlock['kind'],
      text: textOf(match[2]),
    }))
    .filter((block) => block.text);
  return blocks;
};

const readImages = (html: string) => [
  ...new Set(
    [
      ...listingPart(html).matchAll(
        /property="og:image" content="(https:\/\/www\.via-ferrata\.de\/wp-content\/sabai\/File\/files\/[^"]+)"/g,
      ),
    ].map((match) => match[1]),
  ),
];

const readFact = (html: string, kind: 'difficulty' | 'duration') =>
  textOf(
    listingPart(html).match(
      new RegExp(`vf-${kind}"[\\s\\S]*?<span>([\\s\\S]*?)<\\/span>`),
    )?.[1] ?? '',
  );

const pageFor = (slug: string) => ({
  name: slug,
  url: `${TOPO}${slug}`,
});

const readCoordinate = (html: string, key: 'lat' | 'lng') => {
  const raw = html.match(new RegExp(`data-${key}="(-?\\d+(?:\\.\\d+)?)"`))?.[1];
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (key === 'lat' && Math.abs(value) > 90) return null;
  if (key === 'lng' && Math.abs(value) > 180) return null;
  return value;
};

export const parseViaFerrataRatings = (
  slug: string,
  html: string,
): ViaFerrataRatings | null => {
  if (!isClimbSlug(slug)) return null;
  const page = pageFor(slug);
  const main = html.split('sabai-directory-main')[1] ?? '';
  const average = Number(main.match(/itemprop="ratingValue">([0-9.]+)/)?.[1]);
  const count = Number(main.match(/itemprop="reviewCount">(\d+)/)?.[1]);
  const description = readDescription(html);
  const images = readImages(html);
  const difficulty = readFact(html, 'difficulty');
  const duration = readFact(html, 'duration');
  const hasRating = Number.isFinite(average) && Number.isFinite(count);
  if (!hasRating && !description.length && !images.length) return null;
  const heading =
    textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '') || page.name;
  const reviews = html
    .split('sabai-directory-review-title')
    .slice(1)
    .map((block) => {
      const title = textOf(block.match(/<span>([\s\S]*?)<\/span>/)?.[1] ?? '');
      const stars = Number(
        block.match(/itemprop="ratingValue">([0-9.]+)/)?.[1],
      );
      const activity =
        block.match(/sabai-entity-activity">([\s\S]*?)<\/ul>/)?.[1] ?? '';
      const author = textOf(
        activity.match(/class="sabai-user[^"]*"[^>]*>([^<]+)/)?.[1] ??
          activity.split(' reviewed ')[0] ??
          '',
      );
      const dated = block.match(
        /href="(https:\/\/www\.via-ferrata\.de\/klettersteige\/reviews\/\d+)" title="([^"]+)"/,
      );
      const body = textOf(
        block.match(/itemprop="reviewBody">([\s\S]*?)<\/div>/)?.[1] ?? '',
      );
      if (!title || !Number.isFinite(stars)) return null;
      return {
        title: clip(title, 180),
        stars,
        author: clip(author, 80),
        date: dated?.[2] ?? '',
        text: clip(body),
        url: dated?.[1] ?? `${page.url}/reviews`,
      };
    })
    .filter((review): review is ViaFerrataReview => review !== null);
  return {
    slug,
    name: heading,
    difficulty,
    duration,
    description,
    images,
    average: hasRating ? average : 0,
    count: hasRating ? count : 0,
    lat: readCoordinate(html, 'lat'),
    lng: readCoordinate(html, 'lng'),
    url: page.url,
    reviews_url: `${page.url}/reviews`,
    reviews,
  };
};

let catalog: { at: number; slugs: string[] } = { at: 0, slugs: [] };

const headers = {
  Accept: 'text/html, application/xml',
  'User-Agent': 'Kletterglueck/1.0 (private family app)',
};

export const loadClimbSlugs = async () => {
  if (catalog.slugs.length && Date.now() - catalog.at < 6 * 60 * 60 * 1000)
    return catalog.slugs;
  const response = await fetch(SITEMAP, {
    headers,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Sitemap antwortet mit ${response.status}`);
  const slugs = parseClimbSlugs(await response.text());
  if (!slugs.length) throw new Error('Keine Klettersteige in der Sitemap');
  catalog = { at: Date.now(), slugs };
  return slugs;
};

export const readViaFerrataRatings = async (slug: string) => {
  if (!isClimbSlug(slug)) return null;
  const response = await fetch(`${TOPO}${slug}`, {
    headers,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok)
    throw new Error(`via-ferrata antwortet mit ${response.status}`);
  return parseViaFerrataRatings(slug, await response.text());
};

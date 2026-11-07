export type ViaFerrataReview = {
  title: string;
  stars: number;
  author: string;
  date: string;
  text: string;
  url: string;
};

export type ViaFerrataRatings = {
  slug: string;
  name: string;
  average: number;
  count: number;
  url: string;
  reviews_url: string;
  reviews: ViaFerrataReview[];
};

const PAGES: Record<string, { name: string; url: string }> = {
  norissteig: {
    name: 'Norissteig',
    url: 'https://www.via-ferrata.de/klettersteige/topo/norissteig',
  },
  lenzsteig: {
    name: 'Lenzsteig',
    url: 'https://www.via-ferrata.de/klettersteige/topo/lenzsteig',
  },
  stopselzieher: {
    name: 'Stopselzieher',
    url: 'https://www.via-ferrata.de/klettersteige/topo/stopselzieher',
  },
};

const textOf = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#0?39;|'/g, "'")
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const clip = (value: string, max = 500) =>
  value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;

export const viaFerrataPage = (slug: string) => PAGES[slug];

export const parseViaFerrataRatings = (
  slug: string,
  html: string,
): ViaFerrataRatings | null => {
  const page = PAGES[slug];
  if (!page) return null;
  const main = html.split('sabai-directory-main')[1] ?? '';
  const average = Number(main.match(/itemprop="ratingValue">([0-9.]+)/)?.[1]);
  const count = Number(main.match(/itemprop="reviewCount">(\d+)/)?.[1]);
  if (!Number.isFinite(average) || !Number.isFinite(count)) return null;
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
    name: page.name,
    average,
    count,
    url: page.url,
    reviews_url: `${page.url}/reviews`,
    reviews,
  };
};

export const readViaFerrataRatings = async (slug: string) => {
  const page = PAGES[slug];
  if (!page) return null;
  const response = await fetch(page.url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Kletterglueck/1.0 (private family app)',
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`via-ferrata antwortet mit ${response.status}`);
  return parseViaFerrataRatings(slug, await response.text());
};

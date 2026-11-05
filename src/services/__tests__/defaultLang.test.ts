import { getServerIntl, DEFAULT_LANG } from '../intlServer';

const ctx = (locale: string, headers: Record<string, string> = {}) => ({
  locale,
  req: { headers },
  res: { setHeader: jest.fn() },
});

// jsdom makes universal-cookie read document.cookie instead of the request
// header. On the server (no window) next-cookies uses the header.
const setLangCookie = (lang: string) => {
  document.cookie = `lang=${lang}`;
};

describe('default language', () => {
  beforeEach(() => {
    document.cookie = 'lang=; Max-Age=0';
  });

  it('opens in German even when the browser asks for English', async () => {
    expect(DEFAULT_LANG).toBe('de');
    const intl = await getServerIntl(
      ctx('default', { 'accept-language': 'en-US,en;q=0.9' }),
    );
    expect(intl.lang).toBe('de');
    expect(intl.messages['project.brand_name']).toBe('Klettersteig-Karte');
    expect(intl.messages['crag_filter.only_ferrata']).toBe('Nur Klettersteige');
    expect(intl.messages['searchbox.placeholder']).toMatch(/Klettersteig/);
  });

  it('still honours a language cookie and a URL prefix', async () => {
    setLangCookie('en');
    const fromCookie = await getServerIntl(
      ctx('default', { cookie: 'lang=en' }),
    );
    expect(fromCookie.lang).toBe('en');
    expect(fromCookie.messages['searchbox.placeholder']).toBe('Search');

    const fromUrl = await getServerIntl(ctx('fr'));
    expect(fromUrl.lang).toBe('fr');
  });
});

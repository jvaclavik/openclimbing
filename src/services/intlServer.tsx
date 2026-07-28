import acceptLanguageParser from 'accept-language-parser';
import nextCookies from 'next-cookies';
import { LANGUAGES } from '../config.mjs';
import { Intl } from './intl';

// the files are not imported in main bundle
const getMessages = async (lang) =>
  (await import(`../locales/${lang}.js`)).default;

const getLangFromAcceptHeader = (ctx) => {
  const header = ctx.req.headers['accept-language'];
  return acceptLanguageParser.pick(Object.keys(LANGUAGES), header, {
    loose: true,
  });
};

const DEFAULT_LANG = 'en';

const resolveCurrentLang = (ctx) => {
  const langInUrl = ctx.locale;

  // language is forced by URL prefix
  if (LANGUAGES[langInUrl]) {
    ctx.res.setHeader('set-cookie', `lang=${langInUrl}; Path=/`);
    return langInUrl;
  }

  // app is usually used without lang prefix (cookie or accept-language)
  const { lang } = nextCookies(ctx);
  if (lang && LANGUAGES[lang]) {
    return lang;
  }

  return getLangFromAcceptHeader(ctx) ?? DEFAULT_LANG;
};

// _app and _document both need the server intl within the same request; cache
// it on the request object so the locale files + merge run only once per SSR.
const REQUEST_INTL_KEY = '__openclimbingServerIntl';

export const getServerIntl = async (ctx): Promise<Intl> => {
  const req = ctx?.req;
  const cached: Promise<Intl> | undefined = req?.[REQUEST_INTL_KEY];
  if (cached) {
    return cached;
  }

  const compute = async (): Promise<Intl> => {
    const lang = resolveCurrentLang(ctx);
    const vocabulary = await getMessages('vocabulary');
    const messages = lang === DEFAULT_LANG ? {} : await getMessages(lang);

    return {
      lang,
      messages: { ...vocabulary, ...messages },
    };
  };

  const promise = compute();
  if (req) {
    req[REQUEST_INTL_KEY] = promise;
  }
  return promise;
};

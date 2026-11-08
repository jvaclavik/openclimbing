import React from 'react';
import Cookies from 'js-cookie';
import Router from 'next/router';
import { MessagesType, TranslationId } from './types';
import { isBrowser, isServer } from '../components/helpers';
import { getServerIntl } from './intlServer';
import { publishDbgObject } from '../utils';
import { LANGUAGES } from '../config.mjs';

type Values = { [variable: string]: string | number };

export interface Intl {
  lang: string;
  messages: MessagesType | {};
}

export const intl: Intl = {
  lang: '',
  messages: {},
};

const VARIABLE_REGEX = /__([a-zA-Z_]+)__/g;

const replaceValues = (text: string, values: Values) =>
  text.replace(VARIABLE_REGEX, (_, variableName) => {
    const value = values && values[variableName];
    return value != null ? `${value}` : '?';
  });

const replaceTags = (text: string, tags?: Values) =>
  tags
    ? text.replace(/<(\/?)([a-zA-Z_]+)>/g, (_, end, tagName) => {
        const tag = `${tags[tagName]}`;
        if (end) {
          const endTag = tag.split(' ')[0];
          return tag ? `</${endTag}>` : '?';
        }
        return tag ? `<${tag}>` : '?';
      })
    : text;

export const t = (id: TranslationId, values?: Values) => {
  const translation = intl.messages[id] ?? id;
  return replaceValues(translation, values);
};

const pluralCategory = (count: number): string => {
  try {
    return new globalThis.Intl.PluralRules(intl.lang || 'en').select(count);
  } catch {
    return 'other';
  }
};

/**
 * Plural-aware translation: looks up `<baseId>_<category>` (CLDR category:
 * one, few, many, other) and falls back to `<baseId>_other`. `__count__` is
 * always available in the message.
 */
export const tPlural = (baseId: string, count: number, values?: Values) => {
  const messages = intl.messages as Record<string, string>;
  const exact = `${baseId}_${pluralCategory(count)}`;
  const id = messages[exact] != null ? exact : `${baseId}_other`;
  return t(id as TranslationId, { count, ...values });
};

interface Props {
  id: TranslationId;
  values?: Values;
  tags?: Values;
}

export const Translation = ({ id, values, tags }: Props) => {
  const html = replaceTags(t(id, values), tags);
  return <span data-id={id} dangerouslySetInnerHTML={{ __html: html }} />; // eslint-disable-line react/no-danger
};

export const changeLang = (langId: string) => {
  if (langId === intl.lang) return;
  Cookies.set('lang', langId, { expires: 365, path: '/' });

  if (process.env.NEXT_PUBLIC_FAKE_STATIC_EXPORT) {
    window.location.href = `/${langId}`;
    return;
  }

  Router.push(Router.asPath, Router.asPath, { locale: 'default' }).then(() =>
    Router.reload(),
  );
};

export const setIntl = (initialIntl: Intl) => {
  if (initialIntl) {
    if (!LANGUAGES[initialIntl.lang]) {
      throw new Error(`Invalid language: ${initialIntl.lang}`);
    }
    intl.lang = initialIntl.lang;
    intl.messages = initialIntl.messages;
    publishDbgObject('intl', intl);
  }
};

export const InjectIntl = ({ intl: globalIntl }) => (
  <script
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: `var GLOBAL_INTL = ${JSON.stringify(globalIntl)};`,
    }}
  />
);

if (isBrowser()) {
  // GLOBAL_INTL is set in _document.tsx
  setIntl((window as any).GLOBAL_INTL);
}

export const setIntlForSSR = async (ctx) => {
  if (isServer()) {
    setIntl(await getServerIntl(ctx));
  }
};

// We got rid of intl context for easier usage. See commit "Intl: remove intlContext"
// Only drawback is page refresh while changing language... we can live with that :-)
// In future consider https://github.com/vinissimus/next-translate

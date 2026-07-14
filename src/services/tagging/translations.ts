import merge from 'lodash/merge';
import { fetchJson } from '../fetch';
import { Field } from './types/Fields';
import { intl } from '../intl';
import { publishDbgObject } from '../../utils';
import { FieldTranslation } from './types/Presets';
import { getOurTranslations } from './ourPresets';

// https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.1.0/dist/translations/en.min.json
const cdnUrl = `https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema`;

// Pinned to the same major as the `@openstreetmap/id-tagging-schema` dependency
// in package.json (bump both together) - an unpinned `latest` silently pulled
// in a breaking change to the `terms` format once (see getPresetTermsTranslation).
const CDN_VERSION_RANGE = '7';

// TODO download up-to-date or use node_module?
let translations = {};
export const fetchSchemaTranslations = async () => {
  if (translations[intl.lang]) return;

  try {
    const presetsPackage = await fetchJson(
      `${cdnUrl}@${CDN_VERSION_RANGE}/package.json`,
    );
    const { version } = presetsPackage;

    // this request is cached in browser
    translations = await fetchJson(
      `${cdnUrl}@${version}/dist/translations/${intl.lang || 'en'}.min.json`,
    );

    merge(translations, getOurTranslations(intl.lang));
  } catch (e) {
    console.log('fetchSchemaTranslations() failed, using local npm', e); // eslint-disable-line no-console
    try {
      // NOTE this is a dynamic import = an async webpack chunk fetched over
      // the network. Offline it fails too (the chunk is never cached — this
      // branch never runs while online), and it must NOT reject the whole
      // call: every offline feature load would crash into the OSM fallback
      // and show a network error, even with the feature data cached.
      const localTranslation = await import(
        `@openstreetmap/id-tagging-schema/dist/translations/en.min.json`
      );
      translations[intl.lang] = localTranslation[intl.lang];
      merge(translations, getOurTranslations(intl.lang));
    } catch (e2) {
      console.log('fetchSchemaTranslations() local npm failed too', e2); // eslint-disable-line no-console
      // proceed with empty translations — getPresetTranslation() falls back
      // to `[key]` and addSchemaToFeature() catches schema errors per feature
      merge(translations, getOurTranslations(intl.lang));
    }
  } finally {
    publishDbgObject('id-tagging-schema translations', translations);
  }
};

export const mockSchemaTranslations = (mockTranslations) => {
  translations = mockTranslations;
};

export const getPresetTranslation = (key: string): string =>
  translations?.[intl.lang]?.presets?.presets?.[key]?.name ?? `[${key}]`;

export const getPresetTermsTranslation = (key: string): string[] => {
  const terms = translations?.[intl.lang]?.presets?.presets?.[key]?.terms;
  if (Array.isArray(terms)) return terms;
  if (typeof terms === 'string') return terms ? terms.split(',') : [];
  return [];
};

export const getAllTranslations = () => translations?.[intl.lang];

export const getFieldTranslation = (field: Field): FieldTranslation => {
  if (!translations) return undefined;

  if (field.label?.match(/^{.*}$/)) {
    const resolved = field.label.substring(1, field.label.length - 1);
    return translations[intl.lang].presets.fields[resolved];
  }

  // The id 169522276 is different for each intl.language :(
  // https://www.transifex.com/openstreetmap/id-editor/translate/#cs/presets/169522276?q=key%3Apresets.fields.XXX
  return translations[intl.lang].presets.fields[field.fieldKey];
};

import { intl } from '../../intl';
import { Field } from '../types/Fields';
import {
  getFieldTranslation,
  getPresetTermsTranslation,
  mockSchemaTranslations,
} from '../translations';

intl.lang = 'en';

describe('getPresetTermsTranslation', () => {
  it('returns terms as-is when already a string[] (current id-tagging-schema format)', () => {
    mockSchemaTranslations({
      en: { presets: { presets: { shop: { terms: ['retailer', 'store'] } } } },
    });

    expect(getPresetTermsTranslation('shop')).toEqual(['retailer', 'store']);
  });

  it('splits a comma-separated string (older id-tagging-schema format)', () => {
    mockSchemaTranslations({
      en: { presets: { presets: { shop: { terms: 'retailer,store' } } } },
    });

    expect(getPresetTermsTranslation('shop')).toEqual(['retailer', 'store']);
  });

  it('returns [] when the preset has no terms', () => {
    mockSchemaTranslations({
      en: { presets: { presets: { shop: { name: 'Shop' } } } },
    });

    expect(getPresetTermsTranslation('shop')).toEqual([]);
  });

  it('returns [] for an unknown preset key', () => {
    mockSchemaTranslations({ en: { presets: { presets: {} } } });

    expect(getPresetTermsTranslation('does-not-exist')).toEqual([]);
  });
});

describe('getFieldTranslation', () => {
  // Regression: `intl.lang` is a module-level singleton shared by every
  // concurrent SSR request. A request for a locale whose translations
  // haven't been fetched yet (or that races another request's fetch) used to
  // crash the whole page with "Cannot read properties of undefined (reading
  // 'presets')" instead of just falling back to the untranslated label.
  it('returns undefined instead of throwing when the current lang has no translations loaded', () => {
    mockSchemaTranslations({ en: { presets: { fields: {} } } });
    intl.lang = 'de'; // not present in the mocked translations

    const field = { fieldKey: 'surface' } as Field;

    expect(() => getFieldTranslation(field)).not.toThrow();
    expect(getFieldTranslation(field)).toBeUndefined();

    intl.lang = 'en';
  });

  it('resolves a field by fieldKey', () => {
    mockSchemaTranslations({
      en: { presets: { fields: { surface: { label: 'Surface' } } } },
    });

    const field = { fieldKey: 'surface' } as Field;

    expect(getFieldTranslation(field)).toEqual({ label: 'Surface' });
  });

  it('resolves a {template} label by looking up the referenced field', () => {
    mockSchemaTranslations({
      en: { presets: { fields: { surface: { label: 'Surface' } } } },
    });

    const field = { fieldKey: 'crag/surface', label: '{surface}' } as Field;

    expect(getFieldTranslation(field)).toEqual({ label: 'Surface' });
  });
});

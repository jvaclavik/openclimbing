import { combineTags } from '../combinedTags';

describe('combineTags', () => {
  it('returns every tag of a single item as shared', () => {
    expect(
      combineTags([{ climbing: 'route', 'climbing:boulder': 'yes' }]),
    ).toEqual({
      shared: { climbing: 'route', 'climbing:boulder': 'yes' },
      mixed: {},
      keys: ['climbing', 'climbing:boulder'],
    });
  });

  it('keeps a value only when every item has it', () => {
    const combined = combineTags([
      { 'climbing:boulder': 'yes', 'climbing:sport': 'yes' },
      { 'climbing:boulder': 'yes' },
      { 'climbing:boulder': 'yes', 'climbing:sport': 'no' },
    ]);

    expect(combined.shared).toEqual({ 'climbing:boulder': 'yes' });
    expect(combined.mixed['climbing:sport']).toEqual(['yes', 'no']);
    expect(combined.keys).toEqual(['climbing:boulder', 'climbing:sport']);
  });

  it('treats a missing key as a different value', () => {
    const combined = combineTags([
      { 'climbing:boulder': 'yes' },
      { name: 'Other' },
    ]);

    expect(combined.shared).toEqual({});
    expect(combined.mixed['climbing:boulder']).toEqual(['yes']);
    expect(combined.mixed.name).toEqual(['Other']);
  });
});

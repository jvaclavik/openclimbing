import {
  getWikimediaCommonsFileName,
  getWikimediaThumbWidth,
  resizeWikimediaThumbUrl,
} from '../getCommonsImageUrl';

const wikipediaPageimage =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/2014_Schwedenturm_Rathen.JPG/500px-2014_Schwedenturm_Rathen.JPG?utm_source=de.wikipedia.org&utm_campaign=api&utm_content=thumbnail';
const wikidataP18 =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/2014_Schwedenturm_Rathen.JPG/500px-2014_Schwedenturm_Rathen.JPG';

test('extracts the same Commons file from Wikipedia and Wikidata thumbs', () => {
  expect(getWikimediaCommonsFileName(wikipediaPageimage)).toBe(
    '2014_Schwedenturm_Rathen.JPG',
  );
  expect(getWikimediaCommonsFileName(wikidataP18)).toBe(
    '2014_Schwedenturm_Rathen.JPG',
  );
});

test('reads thumb width from the path, ignoring query string', () => {
  expect(getWikimediaThumbWidth(wikipediaPageimage)).toBe(500);
  expect(getWikimediaThumbWidth(wikidataP18)).toBe(500);
});

test('resizes Wikipedia thumb.wikimedia.org urls', () => {
  expect(resizeWikimediaThumbUrl(wikipediaPageimage, 40)).toBe(
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/2014_Schwedenturm_Rathen.JPG/40px-2014_Schwedenturm_Rathen.JPG?utm_source=de.wikipedia.org&utm_campaign=api&utm_content=thumbnail',
  );
});

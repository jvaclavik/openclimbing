import { getCragCardPhotoItems } from '../cragCardPhotos';
import { ImageDef } from '../../../../../services/types';
import { ImagesType } from '../../../FeatureImages/useLoadImages';

const image = (k: string, url: string): ImagesType[number] => ({
  def: { type: 'tag', k, v: url, instant: true },
  image: {
    imageUrl: url,
    description: k,
    linkUrl: url,
    link: k,
  },
});

const tag = (k: string, instant = false): ImageDef => ({
  type: 'tag',
  k,
  v: `${k}-file`,
  instant,
});

describe('getCragCardPhotoItems', () => {
  it('reserves placeholders for known tag photos while they load', () => {
    const defs = [tag('image', true), tag('wikipedia'), tag('wikidata')];
    const items = getCragCardPhotoItems({
      defs,
      images: [image('image', 'https://example.com/a.jpg')],
      loading: true,
      limit: 3,
    });

    expect(items).toHaveLength(3);
    expect(items[0].image).not.toBeNull();
    expect(items[1].image).toBeNull();
    expect(items[2].image).toBeNull();
  });

  it('drops placeholders after loading so merged duplicates do not stay empty', () => {
    const defs = [tag('image', true), tag('wikipedia'), tag('wikidata')];
    const items = getCragCardPhotoItems({
      defs,
      images: [image('image', 'https://example.com/a.jpg')],
      loading: false,
      limit: 3,
    });

    expect(items).toHaveLength(1);
    expect(items[0].image).not.toBeNull();
  });

  it('does not reserve space for speculative nearby photos', () => {
    const defs: ImageDef[] = [
      { type: 'center', service: 'mapillary', center: [14, 50] },
    ];
    const items = getCragCardPhotoItems({
      defs,
      images: [],
      loading: true,
      limit: 3,
    });

    expect(items).toEqual([]);
  });
});

import { getImagePlaceholderUrl } from '../getImagePlaceholderUrl';
import { ImageType } from '../getImageDefs';

const image = (rest: Partial<ImageType>): ImageType => ({
  imageUrl: '',
  description: '',
  linkUrl: '',
  link: '',
  ...rest,
});

test('derives a tiny thumb from a wikimedia url', () => {
  expect(
    getImagePlaceholderUrl(
      image({
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Foo.jpg/500px-Foo.jpg',
      }),
    ),
  ).toBe(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Foo.jpg/40px-Foo.jpg',
  );
});

test('prefers the url given by the provider', () => {
  expect(
    getImagePlaceholderUrl(
      image({
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Foo.jpg/500px-Foo.jpg',
        placeholderUrl: 'tiny.jpg',
      }),
    ),
  ).toBe('tiny.jpg');
});

test('has no placeholder for foreign urls', () => {
  expect(
    getImagePlaceholderUrl(image({ imageUrl: 'https://example.com/foo.jpg' })),
  ).toBeUndefined();
});

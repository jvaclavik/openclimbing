import { collectPhotoPaths, PathSource } from '../wikimediaCommonsPhotoPaths';

const crag: PathSource = {
  shortId: 'r1',
  tags: {
    wikimedia_commons: 'File:Photo one.jpg',
    'wikimedia_commons:2': 'File:Photo two.jpg',
  },
};

const route = (shortId: string, photo: string, path: string): PathSource => ({
  shortId,
  tags: {
    wikimedia_commons: photo,
    'wikimedia_commons:path': path,
    'climbing:grade:uiaa': '6',
  },
});

const fileKeys = ['wikimedia_commons', 'wikimedia_commons:2'];

describe('collectPhotoPaths', () => {
  it('returns no paths when nothing is drawn', () => {
    expect(collectPhotoPaths(crag, [], fileKeys)).toEqual({
      wikimedia_commons: [],
      'wikimedia_commons:2': [],
    });
  });

  it('collects member paths onto the photo they are drawn on', () => {
    const members = [
      route('n1', 'File:Photo one.jpg', '0.1,0.2|0.3,0.4'),
      route('n2', 'File:Photo two.jpg', '0.5,0.6|0.7,0.8'),
    ];

    const result = collectPhotoPaths(crag, members, fileKeys);

    expect(result['wikimedia_commons'].map(({ key }) => key)).toEqual([
      'n1-wikimedia_commons',
    ]);
    expect(result['wikimedia_commons:2'].map(({ key }) => key)).toEqual([
      'n2-wikimedia_commons',
    ]);
    expect(result['wikimedia_commons'][0].path).toEqual([
      { x: 0.1, y: 0.2, suffix: '' },
      { x: 0.3, y: 0.4, suffix: '' },
    ]);
    expect(result['wikimedia_commons'][0].tags).toBe(members[0].tags);
  });

  it('matches photos regardless of underscores and the File: prefix', () => {
    const members = [route('n1', 'Photo_one.jpg', '0.1,0.2|0.3,0.4')];

    expect(
      collectPhotoPaths(crag, members, fileKeys)['wikimedia_commons'],
    ).toHaveLength(0); // value without `File:` is not a photo slot

    const prefixed = [route('n2', 'File:Photo_one.jpg', '0.1,0.2|0.3,0.4')];
    expect(
      collectPhotoPaths(crag, prefixed, fileKeys)['wikimedia_commons'],
    ).toHaveLength(1);
  });

  it('includes the item own path and skips single-point paths', () => {
    const item: PathSource = {
      shortId: 'n9',
      tags: {
        wikimedia_commons: 'File:Photo one.jpg',
        'wikimedia_commons:path': '0.1,0.2|0.3,0.4',
        'wikimedia_commons:2': 'File:Photo two.jpg',
        'wikimedia_commons:2:path': '0.5,0.6',
      },
    };

    const result = collectPhotoPaths(item, [], fileKeys);

    expect(result['wikimedia_commons'].map(({ key }) => key)).toEqual([
      'n9-wikimedia_commons',
    ]);
    expect(result['wikimedia_commons:2']).toEqual([]);
  });

  it('reacts to the photo the slot currently points at', () => {
    const members = [route('n1', 'File:Photo two.jpg', '0.1,0.2|0.3,0.4')];
    const retargeted: PathSource = {
      ...crag,
      tags: { ...crag.tags, wikimedia_commons: 'File:Photo two.jpg' },
    };

    expect(
      collectPhotoPaths(crag, members, fileKeys)['wikimedia_commons'],
    ).toHaveLength(0);
    expect(
      collectPhotoPaths(retargeted, members, fileKeys)['wikimedia_commons'],
    ).toHaveLength(1);
  });
});

import { getCommonsImageUrl } from '../getCommonsImageUrl';

const setOnline = (online: boolean) =>
  Object.defineProperty(navigator, 'onLine', {
    value: online,
    configurable: true,
  });

describe('getCommonsImageUrl offline width snapping', () => {
  afterEach(() => setOnline(true));

  it('passes the requested width through when online', () => {
    setOnline(true);
    expect(getCommonsImageUrl('File:Foo.jpg', 960)).toContain('/960px-');
  });

  it('snaps up to the nearest cached width when offline', () => {
    setOnline(false);
    // cached widths are [500, 1920]: 960 -> 1920, 120 -> 500
    expect(getCommonsImageUrl('File:Foo.jpg', 960)).toContain('/1920px-');
    expect(getCommonsImageUrl('File:Foo.jpg', 120)).toContain('/500px-');
  });

  it('caps at the largest cached width when offline', () => {
    setOnline(false);
    expect(getCommonsImageUrl('File:Foo.jpg', 3840)).toContain('/1920px-');
  });

  it('keeps a cached width unchanged when offline', () => {
    setOnline(false);
    expect(getCommonsImageUrl('File:Foo.jpg', 500)).toContain('/500px-');
  });
});

import { getViewFromBbox } from '../getViewFromBbox';

const VIEWPORT = { width: 1000, height: 800, padding: 0 };

describe('getViewFromBbox', () => {
  it('centers the bbox and zooms so that it fits the viewport', () => {
    const [zoom, lat, lon] = getViewFromBbox([14, 50, 14.02, 50.01], VIEWPORT);

    expect(lon).toBe('14.0100');
    expect(parseFloat(lat)).toBeCloseTo(50.005, 3);
    expect(parseFloat(zoom)).toBeCloseTo(15.1, 1);
  });

  it('fits the limiting dimension - a tall bbox in a wide viewport', () => {
    const [zoomWide] = getViewFromBbox([14, 50, 14.02, 50.001], VIEWPORT);
    const [zoomTall] = getViewFromBbox([14, 50, 14.001, 50.02], VIEWPORT);

    expect(parseFloat(zoomTall)).toBeLessThan(parseFloat(zoomWide));
  });

  it('never zooms in more than maxZoom', () => {
    const [zoom] = getViewFromBbox([14, 50, 14.00001, 50.00001], VIEWPORT);

    expect(zoom).toBe('17.00');
  });

  it('shifts the center west, so the bbox is not hidden behind the panel', () => {
    const [, lat, lon] = getViewFromBbox([14, 50, 14.02, 50.01], {
      ...VIEWPORT,
      panelWidth: 410,
    });

    expect(parseFloat(lon)).toBeLessThan(14.01);
    expect(parseFloat(lat)).toBeCloseTo(50.005, 3);
  });

  it('returns undefined for a bbox degenerated to a point', () => {
    expect(getViewFromBbox([14, 50, 14, 50], VIEWPORT)).toBeUndefined();
  });
});

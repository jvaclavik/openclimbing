import nextCookies from 'next-cookies';
import {
  DEFAULT_VIEW,
  getInitialMapView,
  getMapViewFromHash,
} from '../helpers';

jest.mock('next-cookies', () => jest.fn());

const cookies = nextCookies as unknown as jest.Mock;

describe('initial map view', () => {
  it('opens on Franconia and the northern Alps when nothing is saved', async () => {
    cookies.mockReturnValue({});
    await expect(getInitialMapView({} as never)).resolves.toEqual(DEFAULT_VIEW);
    expect(Number(DEFAULT_VIEW[0])).toBeGreaterThanOrEqual(6);
    expect(Number(DEFAULT_VIEW[0])).toBeLessThanOrEqual(7);
    expect(Number(DEFAULT_VIEW[1])).toBeCloseTo(48.5, 1);
    expect(Number(DEFAULT_VIEW[2])).toBeCloseTo(11, 1);
  });

  it('keeps a saved mapView cookie', async () => {
    cookies.mockReturnValue({ mapView: '12/47.26/11.39' });
    await expect(getInitialMapView({} as never)).resolves.toEqual([
      '12',
      '47.26',
      '11.39',
    ]);
  });

  it('reads a #z/lat/lon hash and ignores anything else', () => {
    window.location.hash = '#9.25/47.3/11.4';
    expect(getMapViewFromHash()).toEqual(['9.25', '47.3', '11.4']);

    window.location.hash = '#not-a-view';
    expect(getMapViewFromHash()).toBeUndefined();

    window.location.hash = '#8/47';
    expect(getMapViewFromHash()).toBeUndefined();
  });
});

import {
  getStartPhotoDescription,
  getStartPhotoFilenameStem,
} from '../startPhoto';
import { Feature } from '../../../types';

const feature = (tags: Record<string, string>, parents: Feature[] = []) =>
  ({ tags, parentFeatures: parents }) as unknown as Feature;

const area = feature({ climbing: 'area', name: 'Labak' });
const crag = feature({ climbing: 'crag', name: 'Velká stěna' });

describe('start photo naming', () => {
  it('names the photo after the area, crag and route', () => {
    const route = feature({ climbing: 'route_bottom', name: 'Kámen/Sůl' }, [
      crag,
      area,
    ]);

    expect(getStartPhotoFilenameStem(route)).toBe(
      'Labak - Velká stěna - KámenSůl - start',
    );
    expect(getStartPhotoDescription(route)).toBe(
      'Start of climbing route Kámen/Sůl at Velká stěna',
    );
  });

  it('works without parents and name', () => {
    const route = feature({ climbing: 'route_bottom' });

    expect(getStartPhotoFilenameStem(route)).toBe('Climbing route - start');
    expect(getStartPhotoDescription(route)).toBe('Start of a climbing route');
  });
});

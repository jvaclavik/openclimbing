import { cityFromPhotonProperties } from '../reverseGeocodeCity';

describe('cityFromPhotonProperties', () => {
  it('prefers city over smaller place names', () => {
    expect(
      cityFromPhotonProperties({
        city: 'Prague',
        locality: 'Zlíchov',
      }),
    ).toBe('Prague');
  });

  it('falls back to town, village, then locality', () => {
    expect(cityFromPhotonProperties({ town: 'Písek' })).toBe('Písek');
    expect(cityFromPhotonProperties({ village: 'Sobotka' })).toBe('Sobotka');
    expect(cityFromPhotonProperties({ locality: 'Zlíchov' })).toBe('Zlíchov');
  });

  it('returns null when photon has no place name', () => {
    expect(cityFromPhotonProperties(undefined)).toBeNull();
    expect(cityFromPhotonProperties({})).toBeNull();
    expect(cityFromPhotonProperties({ city: '  ' })).toBeNull();
  });
});

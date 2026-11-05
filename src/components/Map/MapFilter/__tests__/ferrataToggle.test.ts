import { isFerrataOnly, toggleFerrataOnly } from '../ferrataToggle';

describe('toggleFerrataOnly', () => {
  const mixed = { rock: true, ferrata: true, gym: false };

  it('hides rock and gyms, then restores the previous types', () => {
    const on = toggleFerrataOnly(mixed, null);
    expect(on.poiTypes).toEqual({ rock: false, ferrata: true, gym: false });
    expect(isFerrataOnly(on.poiTypes)).toBe(true);
    expect(on.restore).toEqual(mixed);

    const off = toggleFerrataOnly(on.poiTypes, on.restore);
    expect(off.poiTypes).toEqual(mixed);
    expect(off.restore).toBeNull();
  });

  it('falls back to rock and ferratas when nothing was saved', () => {
    const off = toggleFerrataOnly(
      { rock: false, ferrata: true, gym: false },
      null,
    );
    expect(off.poiTypes).toEqual({ rock: true, ferrata: true, gym: false });
  });
});

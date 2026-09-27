import { resolveStyle } from '../TickStyleWizard';

describe('resolveStyle', () => {
  it('returns RK when the route was finished from a no-hands rest after a fall', () => {
    expect(resolveStyle({ clean: 'no', noHandRest: 'yes' })).toBe('RK');
  });

  it('returns PJ when the route was not finished', () => {
    expect(resolveStyle({ clean: 'no', noHandRest: 'no' })).toBe('PJ');
  });

  it('waits for the no-hands answer before suggesting a style', () => {
    expect(resolveStyle({ clean: 'no' })).toBe(null);
  });

  it('keeps resolving clean sends', () => {
    expect(
      resolveStyle({
        clean: 'yes',
        method: 'lead',
        prePlaced: 'no',
        firstAttempt: 'yes',
        beta: 'no',
      }),
    ).toBe('OS');
    expect(
      resolveStyle({
        clean: 'yes',
        method: 'lead',
        prePlaced: 'yes',
        firstAttempt: 'no',
      }),
    ).toBe('PP');
    expect(resolveStyle({ clean: 'yes', method: 'tr' })).toBe('TR');
    expect(resolveStyle({ clean: 'yes', method: 'solo' })).toBe('FS');
  });
});

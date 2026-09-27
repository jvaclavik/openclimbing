import { resolveStyle } from '../TickStyleWizard';

describe('resolveStyle', () => {
  it('returns RK when the route was finished from a no-hands rest after a fall', () => {
    expect(resolveStyle({ clean: 'no', noHandRest: 'yes' })).toBe('RK');
  });

  it('returns RX when the top was reached with help from the gear', () => {
    expect(resolveStyle({ clean: 'no', noHandRest: 'no', aid: 'yes' })).toBe(
      'RX',
    );
  });

  it('returns PF when all moves were climbed in sections, but not in one push', () => {
    expect(
      resolveStyle({
        clean: 'no',
        noHandRest: 'no',
        aid: 'no',
        allMoves: 'yes',
      }),
    ).toBe('PF');
  });

  it('returns PJ when some moves are still unsolved', () => {
    expect(
      resolveStyle({
        clean: 'no',
        noHandRest: 'no',
        aid: 'no',
        allMoves: 'no',
      }),
    ).toBe('PJ');
  });

  it('waits for the follow-up answers before suggesting a style', () => {
    expect(resolveStyle({ clean: 'no' })).toBe(null);
    expect(resolveStyle({ clean: 'no', noHandRest: 'no' })).toBe(null);
    expect(resolveStyle({ clean: 'no', noHandRest: 'no', aid: 'no' })).toBe(
      null,
    );
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

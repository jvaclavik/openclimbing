import { ClimbingTick } from '../../../types';
import {
  buildPartnersForCopy,
  buildTickCopies,
  buildTickCopy,
  getAlreadyLoggedMentionIds,
  isUserMentioned,
  MentionedClimbingTick,
} from '../tickMentions';

const tick = (over: Partial<MentionedClimbingTick>): MentionedClimbingTick => ({
  id: 1,
  osmUserId: 2,
  shortId: 'n1',
  timestamp: '2025-05-01T12:00:00.000Z',
  style: 'RP',
  myGrade: '7a',
  note: 'note',
  pairing: null,
  ownerDisplayName: 'pepa',
  ...over,
});

describe('isUserMentioned', () => {
  it('matches case-insensitively and ignores trailing punctuation', () => {
    expect(isUserMentioned('s @Jan, @karel', 'jan')).toBe(true);
    expect(isUserMentioned('(@jan)', 'Jan')).toBe(true);
    expect(isUserMentioned('@janek', 'jan')).toBe(false);
    expect(isUserMentioned('jan', 'jan')).toBe(false);
  });
});

describe('buildPartnersForCopy', () => {
  it('replaces my mention with the owner', () => {
    expect(buildPartnersForCopy('s @jan a @karel', 'jan', 'pepa')).toBe(
      's @pepa a @karel',
    );
  });

  it('keeps punctuation after the mention', () => {
    expect(buildPartnersForCopy('@Jan, @karel', 'jan', 'pepa')).toBe(
      '@pepa, @karel',
    );
  });

  it('drops my mention when the owner is already mentioned', () => {
    expect(buildPartnersForCopy('@pepa a @jan', 'jan', 'pepa')).toBe('@pepa a');
  });

  it('does not touch longer nicknames', () => {
    expect(buildPartnersForCopy('@janek @jan', 'jan', 'pepa')).toBe(
      '@janek @pepa',
    );
  });

  it('leaves a longer nickname with punctuation alone', () => {
    expect(buildPartnersForCopy('@jan.foo @jan', 'jan', 'pepa')).toBe(
      '@jan.foo @pepa',
    );
  });

  it('removes my mention when owner is unknown', () => {
    expect(buildPartnersForCopy('@jan @karel', 'jan', null)).toBe('@karel');
  });
});

describe('getAlreadyLoggedMentionIds', () => {
  it('matches the same route on the same day', () => {
    const mentioned = [
      tick({ id: 1 }),
      tick({ id: 2, shortId: 'n2' }),
      tick({ id: 3, timestamp: '2025-05-02T12:00:00.000Z' }),
    ];
    const own = [
      { ...tick({ id: 10, osmUserId: 1 }), timestamp: '2025-05-01T08:00:00Z' },
    ] as ClimbingTick[];
    expect([...getAlreadyLoggedMentionIds(mentioned, own)]).toEqual([1]);
  });
});

describe('buildTickCopy', () => {
  const source = tick({ pairing: { partners: 's @jan' } });

  it('copies route, date, style and partners but not grade/note', () => {
    expect(buildTickCopy(source, 'jan')).toEqual({
      shortId: 'n1',
      timestamp: '2025-05-01T12:00:00.000Z',
      style: 'RP',
      pairing: { partners: 's @pepa' },
    });
  });

  it('can override the style', () => {
    expect(
      buildTickCopy(source, 'jan', { kind: 'fixed', style: 'TR' }).style,
    ).toBe('TR');
  });
});

describe('buildTickCopies', () => {
  it('creates one tick per route and day, with all tagging partners', () => {
    const copies = buildTickCopies(
      [
        tick({
          id: 1,
          pairing: { partners: '@jan' },
          ownerDisplayName: 'pepa',
        }),
        tick({
          id: 2,
          pairing: { partners: '@jan' },
          ownerDisplayName: 'karel',
        }),
        tick({ id: 3, shortId: 'n2', ownerDisplayName: 'pepa' }),
      ],
      'jan',
    );
    expect(copies).toHaveLength(2);
    expect(copies[0].pairing).toEqual({ partners: '@pepa @karel' });
  });
});

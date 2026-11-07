import { QUARTER_PEEK_PX } from '../../utils/drawerSnap';
import { BOTTOM_RIGHT_Z_DEFAULT } from '../../utils/mapChromeRegistry';
import {
  HERE_STARTER,
  TOUR_HELP_Z,
  messageForSend,
  selectedTourLabel,
  tourHelpAnchor,
} from '../tourHelp';

const here = 'Leichte Touren hier finden';
const experience = 'Welche Tour passt zu meiner Erfahrung?';

test('keeps the help under the map controls', () => {
  expect(TOUR_HELP_Z).toBeLessThan(BOTTOM_RIGHT_Z_DEFAULT);
});

test('anchors a compact panel beside the map instead of covering it', () => {
  const desktop = tourHelpAnchor(null, false);
  expect(desktop.bottom).toBe(88);
  expect(desktop.width).toContain('--feature-panel-width');
  expect(desktop.width).not.toBe('100%');
  expect(desktop.width).not.toBe('100vw');
  expect(desktop.maxHeight).not.toBe('100vh');
  expect(desktop.top).toBeUndefined();

  const phone = tourHelpAnchor('quarter', true);
  expect(phone.bottom).toBe(QUARTER_PEEK_PX + 88);
  expect(phone.width).toBe('min(400px, calc(100vw - 16px))');
  expect(phone.maxHeight).toBe(
    `min(420px, calc(100dvh - ${QUARTER_PEEK_PX + 88 + 180}px))`,
  );

  const halfSheet = tourHelpAnchor('half', true);
  expect(halfSheet.bottom).toBe('calc(50% + 12px)');
  expect(halfSheet.maxHeight.startsWith('min(200px')).toBe(true);
});

test('reads a selected name and ignores coordinates', () => {
  expect(selectedTourLabel(null)).toBeNull();
  expect(selectedTourLabel({ tags: {}, center: [11, 49] } as never)).toBeNull();
  expect(
    selectedTourLabel({ skeleton: true, tags: { name: 'Norissteig' } }),
  ).toBeNull();
  expect(
    selectedTourLabel({
      tags: { name: 'Norissteig', 'addr:city': 'Nürnberg' },
    }),
  ).toBe('Norissteig, Nürnberg');
});

test('attaches the open place only to the here-starter', () => {
  const named = { tags: { name: 'Norissteig', locality: 'Franken' } };
  expect(messageForSend(here, named)).toBe(
    `${HERE_STARTER}\nAusgewählte Karte: Norissteig, Franken`,
  );
  expect(messageForSend(experience, named)).toBe(experience);
  expect(messageForSend(here, { tags: {} })).toBe(here);
  expect(messageForSend(here, { center: [11.07, 49.45] } as never)).toBe(here);
});

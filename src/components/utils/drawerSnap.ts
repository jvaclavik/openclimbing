export type Snap = 'quarter' | 'half' | 'full';

export type SnapOffsets = Record<Snap, number>;

const SNAPS: Snap[] = ['full', 'half', 'quarter'];

const HALF_RATIO = 0.5;
/** Collapsed peek: puller + feature title row (not a % of the sheet). */
const QUARTER_PEEK_PX = 62;

export const FLING_VELOCITY = 0.4; // px/ms

export const DRAWER_TRANSITION =
  'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';

/** How far the sheet is pushed down in each position (0 = full height). */
export const getSnapOffsets = (sheetHeight: number): SnapOffsets => ({
  full: 0,
  half: Math.round(sheetHeight * (1 - HALF_RATIO)),
  quarter: Math.max(0, sheetHeight - QUARTER_PEEK_PX),
});

/** Tap on the puller: expand one step, or collapse full → half. */
export const nextSnapOnPullerTap = (snap: Snap): Snap => {
  if (snap === 'quarter') return 'half';
  if (snap === 'half') return 'full';
  return 'half';
};

export const pickSnap = (
  offset: number,
  velocity: number,
  offsets: SnapOffsets,
): Snap => {
  const positions = SNAPS.map((snap) => [snap, offsets[snap]] as const);

  // a flick moves one position in the direction of the gesture, however short
  if (Math.abs(velocity) > FLING_VELOCITY) {
    const ahead = positions
      .filter(([, y]) => (velocity > 0 ? y > offset + 1 : y < offset - 1))
      .sort(([, a], [, b]) => (velocity > 0 ? a - b : b - a));
    if (ahead.length) {
      return ahead[0][0];
    }
  }

  const [closest] = positions.reduce((best, position) =>
    Math.abs(position[1] - offset) < Math.abs(best[1] - offset) ? position : best,
  ); // prettier-ignore
  return closest;
};

/** Instant transform – transition must already be off (see disableTransition). */
export const applyOffset = (sheet: HTMLElement, offset: number) => {
  // whole pixels – subpixel transforms force extra raster work on iOS
  sheet.style.transform = `translate3d(0, ${Math.round(offset)}px, 0)`;
};

export const disableTransition = (sheet: HTMLElement) => {
  sheet.style.transition = 'none';
};

export const enableTransition = (sheet: HTMLElement) => {
  sheet.style.transition = DRAWER_TRANSITION;
};

/** Animate to a snap position. */
export const animateToOffset = (sheet: HTMLElement | null, offset: number) => {
  if (!sheet) return;
  enableTransition(sheet);
  applyOffset(sheet, offset);
};

/** The scrollable element under the finger, if any. */
export const findScroller = (target: EventTarget | null, root: HTMLElement) => {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== root.parentElement) {
    const { overflowY } = getComputedStyle(element);
    const scrollable = overflowY === 'auto' || overflowY === 'scroll';
    if (scrollable && element.scrollHeight > element.clientHeight) {
      return element;
    }
    element = element.parentElement;
  }

  return null;
};

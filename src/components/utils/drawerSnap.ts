export type Snap = 'collapsed' | 'half' | 'full';

export type SnapOffsets = Record<Snap, number>;

const SNAPS: Snap[] = ['full', 'half', 'collapsed'];

const HALF_RATIO = 0.55;
export const FLING_VELOCITY = 0.4; // px/ms
/** How far past the collapsed peek the sheet must travel to dismiss. */
export const DISMISS_DISTANCE = 80;

export const DRAWER_TRANSITION =
  'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';

/** How far the sheet is pushed down in each position (0 = full height). */
export const getSnapOffsets = (
  sheetHeight: number,
  collapsedHeight: number,
): SnapOffsets => {
  const collapsed = Math.min(collapsedHeight, sheetHeight);
  const half = Math.min(Math.max(sheetHeight * HALF_RATIO, collapsed), sheetHeight); // prettier-ignore

  return {
    full: 0,
    half: Math.round(sheetHeight - half),
    collapsed: Math.round(sheetHeight - collapsed),
  };
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

export const applyOffset = (
  sheet: HTMLElement,
  offset: number,
  animate: boolean,
) => {
  sheet.style.transition = animate ? DRAWER_TRANSITION : 'none';
  sheet.style.transform = `translate3d(0, ${offset}px, 0)`;
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

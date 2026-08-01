import styled from '@emotion/styled';
import React, { Ref, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'; // prettier-ignore
import { Puller } from '../FeaturePanel/helpers/Puller';
import {
  applyOffset,
  DISMISS_DISTANCE,
  DRAWER_TRANSITION,
  findScroller,
  FLING_VELOCITY,
  getSnapOffsets,
  pickSnap,
  Snap,
} from './drawerSnap';

const DRAG_THRESHOLD = 6;

const Sheet = styled.div<{ $topOffset: number }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100% - ${({ $topOffset }) => $topOffset}px);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.palette.background.paper};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  z-index: ${({ theme }) => theme.zIndex.drawer};
  transition: ${DRAWER_TRANSITION};
  will-change: transform;
`;

const Content = styled.main<{ $scrollLocked?: boolean }>`
  flex: 1;
  min-height: 0;
  overflow: ${({ $scrollLocked }) => ($scrollLocked ? 'hidden' : 'auto')};
  overscroll-behavior: contain;
  // nested PanelScrollbars must not steal the gesture in the peek state
  ${({ $scrollLocked }) =>
    $scrollLocked &&
    `
    & * {
      overflow: hidden !important;
      overscroll-behavior: none;
    }
  `}
`;

/** Remeasured on resize – the sheet grows when the mobile URL bar hides. */
const useSheetHeight = (sheetRef: React.RefObject<HTMLDivElement>) => {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    const observer = new ResizeObserver(() => setHeight(sheet.clientHeight));
    observer.observe(sheet);
    setHeight(sheet.clientHeight);

    return () => observer.disconnect();
  }, [sheetRef]);

  return height;
};

const resetScroll = (root: HTMLElement) => {
  root.scrollTop = 0;
  root.querySelectorAll('*').forEach((node) => {
    if (node instanceof HTMLElement && node.scrollTop) {
      node.scrollTop = 0;
    }
  });
};

type DragState = {
  startY: number;
  startOffset: number;
  scroller: HTMLElement | null;
  mode: 'undecided' | 'drag' | 'scroll';
  lastY: number;
  lastTime: number;
  velocity: number;
};

type UseDragToSnapProps = {
  sheetRef: React.RefObject<HTMLDivElement>;
  sheetHeight: number;
  offsets: ReturnType<typeof getSnapOffsets>;
  snap: Snap;
  settle: (snap: Snap) => void;
  onDismiss?: () => void;
};

/**
 * Native touch handling – the sheet follows the finger and snaps to the
 * closest position on release. A drag in the content area only takes over when
 * scrolling can't continue in that direction, so the two never fight.
 * In the collapsed peek the content never scrolls: up expands, down dismisses.
 */
const useDragToSnap = ({
  sheetRef,
  sheetHeight,
  offsets,
  snap,
  settle,
  onDismiss,
}: UseDragToSnapProps) => {
  const drag = useRef<DragState | null>(null);
  const dismissing = useRef(false);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || dismissing.current) {
        drag.current = null;
        return;
      }
      const { clientY } = e.touches[0];
      drag.current = {
        startY: clientY,
        startOffset: offsets[snap],
        // peek state is drag-only – ignore nested scrollers entirely
        scroller: snap === 'collapsed' ? null : findScroller(e.target, sheet),
        mode: 'undecided',
        lastY: clientY,
        lastTime: e.timeStamp,
        velocity: 0,
      };
    };

    // scroll wins whenever the content can still move in the gesture's
    // direction – otherwise the sheet itself is dragged between snap points
    const canScroll = (scroller: HTMLElement | null, dy: number) => {
      if (!scroller) return false;
      if (dy > 0) return scroller.scrollTop > 0; // finger down → scroll up
      return (
        scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1
      );
    };

    const decideMode = (state: DragState, dy: number) => {
      if (snap === 'collapsed') return 'drag';
      return canScroll(state.scroller, dy) ? 'scroll' : 'drag';
    };

    const onTouchMove = (e: TouchEvent) => {
      const state = drag.current;
      if (!state) return;

      const { clientY } = e.touches[0];
      const dy = clientY - state.startY;

      if (state.mode === 'undecided') {
        if (Math.abs(dy) < DRAG_THRESHOLD) return;
        state.mode = decideMode(state, dy);
        state.startY = clientY; // avoid a jump when the drag takes over
      }
      if (state.mode !== 'drag') return;

      if (e.cancelable) e.preventDefault();

      const elapsed = e.timeStamp - state.lastTime;
      if (elapsed > 0) {
        state.velocity = (clientY - state.lastY) / elapsed;
        state.lastY = clientY;
        state.lastTime = e.timeStamp;
      }

      const offset = state.startOffset + (clientY - state.startY);
      // past collapsed the sheet can slide off-screen to dismiss
      const maxOffset = onDismiss ? sheetHeight : offsets.collapsed;
      const clamped = Math.min(Math.max(offset, 0), maxOffset);
      applyOffset(sheet, clamped, false);
    };

    const shouldDismiss = (offset: number, velocity: number) => {
      if (!onDismiss) return false;
      return (
        offset > offsets.collapsed + DISMISS_DISTANCE ||
        (velocity > FLING_VELOCITY && offset > offsets.collapsed + 10)
      );
    };

    const onTouchEnd = () => {
      const state = drag.current;
      drag.current = null;
      if (state?.mode !== 'drag') return;

      const current = new DOMMatrix(getComputedStyle(sheet).transform).m42;
      if (shouldDismiss(current, state.velocity)) {
        dismissing.current = true;
        applyOffset(sheet, sheetHeight, true);
        return;
      }

      settle(pickSnap(current, state.velocity, offsets));
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target !== sheet || e.propertyName !== 'transform') return;
      if (!dismissing.current) return;
      dismissing.current = false;
      onDismiss?.();
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', onTouchEnd);
    sheet.addEventListener('touchcancel', onTouchEnd);
    sheet.addEventListener('transitionend', onTransitionEnd);

    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
      sheet.removeEventListener('touchcancel', onTouchEnd);
      sheet.removeEventListener('transitionend', onTransitionEnd);
    };
  }, [sheetRef, sheetHeight, offsets, snap, settle, onDismiss]);
};

type Props = {
  onTransitionEnd?: (
    e: React.TransitionEvent<HTMLDivElement>,
    open: boolean,
  ) => void;
  onDismiss?: () => void;
  children: React.ReactNode;
  topOffset: number;
  collapsedHeight: number;
  className: string;
  defaultOpen?: boolean;
  scrollRef?: Ref<HTMLDivElement>;
};

export const Drawer = ({
  children,
  topOffset,
  collapsedHeight,
  className,
  onTransitionEnd,
  onDismiss,
  defaultOpen = false,
  scrollRef,
}: Props) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetHeight = useSheetHeight(sheetRef);
  const offsets = useMemo(
    () => getSnapOffsets(sheetHeight, collapsedHeight),
    [sheetHeight, collapsedHeight],
  );

  const [snap, setSnap] = useState<Snap>(defaultOpen ? 'half' : 'collapsed');
  const settled = useRef(false);
  const scrollLocked = snap === 'collapsed';

  // the sheet is placed without animation until it first reaches its position
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !sheetHeight) return;

    applyOffset(sheet, offsets[snap], settled.current);
    settled.current = true;
  }, [offsets, snap, sheetHeight]);

  useLayoutEffect(() => {
    if (!scrollLocked || !sheetRef.current) return;
    resetScroll(sheetRef.current);
  }, [scrollLocked, sheetHeight]);

  const settle = useCallback(
    (target: Snap) => {
      setSnap(target);
      applyOffset(sheetRef.current, getSnapOffsets(sheetHeight, collapsedHeight)[target], true); // prettier-ignore
    },
    [collapsedHeight, sheetHeight],
  );

  useDragToSnap({
    sheetRef,
    sheetHeight,
    offsets,
    snap,
    settle,
    onDismiss,
  });

  const setOpen = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === 'function' ? value(snap !== 'collapsed') : value; // prettier-ignore
    settle(open ? 'full' : 'collapsed');
  };

  return (
    <Sheet
      ref={sheetRef}
      className={className}
      $topOffset={topOffset}
      onTransitionEnd={(e) => onTransitionEnd?.(e, snap !== 'collapsed')}
    >
      <Puller setOpen={setOpen} open={snap !== 'collapsed'} />
      <Content ref={scrollRef} $scrollLocked={scrollLocked}>
        {children}
      </Content>
    </Sheet>
  );
};

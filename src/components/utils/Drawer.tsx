import styled from '@emotion/styled';
import React, { Ref, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'; // prettier-ignore
import { Puller } from '../FeaturePanel/helpers/Puller';
import {
  animateToOffset,
  applyOffset,
  disableTransition,
  findScroller,
  getSnapOffsets,
  nextSnapOnPullerTap,
  pickSnap,
  Snap,
  SnapOffsets,
} from './drawerSnap';
import { setDrawerSnap } from './mapChromeRegistry';

const DRAG_THRESHOLD = 6;
/** Toggled via classList (no React render) while the finger tracks the sheet. */
const DRAGGING_CLASS = 'drawer--dragging';

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
  overflow: hidden;
  // light edge only – blurry shadows re-rasterize every frame on iOS
  box-shadow: 0 -0.5px 0 rgba(0, 0, 0, 0.12);
  z-index: ${({ theme }) => theme.zIndex.drawer};
  transform: translate3d(0, 100%, 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  contain: layout style;

  &.${DRAGGING_CLASS} {
    will-change: transform;
    // overflow+radius masking is the main drag cost; drop it while moving
    overflow: visible;
    box-shadow: none;
    // skip hit-testing the heavy panel tree mid-gesture
    & > * {
      pointer-events: none;
    }
  }
`;

const Content = styled.main<{ $lockScroll?: boolean }>`
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  background: transparent;
  // no transform here – it would break position:sticky inside the panel
  -webkit-overflow-scrolling: touch;
  // while the sheet isn't full, vertical pan is ours (resize) but horizontal
  // must stay free for galleries etc.
  ${({ $lockScroll }) =>
    $lockScroll
      ? `
    touch-action: pan-x;
    & * {
      touch-action: pan-x;
    }
  `
      : `
    touch-action: pan-x pan-y;
  `}
`;

/** Sits on the sheet (not in the scrollport) so gallery layers can't cover it. */
const Overlay = styled.div`
  position: absolute;
  top: 4px;
  right: 6px;
  z-index: 10;
`;

/** Remeasured on resize – the sheet grows when the mobile URL bar hides. */
const useSheetHeight = (
  sheetRef: React.RefObject<HTMLDivElement>,
  draggingRef: React.MutableRefObject<boolean>,
) => {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    const observer = new ResizeObserver(() => {
      // ignore mid-drag – re-applying snap offsets would fight the finger
      if (draggingRef.current) return;
      setHeight(sheet.clientHeight);
    });
    observer.observe(sheet);
    setHeight(sheet.clientHeight);

    return () => observer.disconnect();
  }, [sheetRef, draggingRef]);

  return height;
};

const resetScroll = (content: HTMLElement | null) => {
  if (content) content.scrollTop = 0;
};

type DragState = {
  startX: number;
  startY: number;
  offset: number;
  scroller: HTMLElement | null;
  /** Currently stealing the gesture to resize the sheet. */
  resizing: boolean;
  /** Sheet moved at least once – touchend should snap. */
  didResize: boolean;
  /** Locked after the first move past the threshold. */
  axis: 'x' | 'y' | null;
  lastY: number;
  lastTime: number;
  velocity: number;
};

type UseSheetGestureProps = {
  sheetRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLElement>;
  offsetsRef: React.MutableRefObject<SnapOffsets>;
  snapRef: React.MutableRefObject<Snap>;
  settleRef: React.MutableRefObject<(snap: Snap) => void>;
  draggingRef: React.MutableRefObject<boolean>;
};

/**
 * Google Maps-style sheet:
 * - on quarter/half, vertical gestures only resize the sheet (no content scroll)
 * - expanding into full continues into content scroll in the same gesture
 * - at full + scrolled to top, pulling down shrinks the sheet again
 * Closing is only via the X button – dragging past quarter just snaps back.
 */
const useSheetGesture = ({
  sheetRef,
  contentRef,
  offsetsRef,
  snapRef,
  settleRef,
  draggingRef,
}: UseSheetGestureProps) => {
  const drag = useRef<DragState | null>(null);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return undefined;

    const setDragging = (active: boolean) => {
      draggingRef.current = active;
      sheet.classList.toggle(DRAGGING_CLASS, active);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        drag.current = null;
        return;
      }
      const { clientX, clientY } = e.touches[0];
      const offsets = offsetsRef.current;
      const content = contentRef.current;
      const scroller =
        content && content.contains(e.target as Node)
          ? content
          : findScroller(e.target, sheet);
      drag.current = {
        startX: clientX,
        startY: clientY,
        offset: offsets[snapRef.current],
        scroller,
        resizing: false,
        didResize: false,
        axis: null,
        lastY: clientY,
        lastTime: e.timeStamp,
        velocity: 0,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const state = drag.current;
      if (!state) return;

      const { clientX, clientY } = e.touches[0];
      const offsets = offsetsRef.current;

      if (!state.axis) {
        const dx = clientX - state.startX;
        const dy = clientY - state.startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        // horizontal wins → leave the gesture to native gallery scrolling
        state.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (state.axis === 'x') return;
        state.lastY = clientY;
        state.lastTime = e.timeStamp;
      }

      if (state.axis === 'x') return;

      const dy = clientY - state.lastY;
      const elapsed = e.timeStamp - state.lastTime;
      if (elapsed > 0) {
        state.velocity = dy / elapsed;
        state.lastY = clientY;
        state.lastTime = e.timeStamp;
      }

      const scroller = state.scroller;
      const scrollTop = scroller?.scrollTop ?? 0;

      // at half/quarter every vertical pan resizes; at full only when at top
      const shouldResize =
        state.offset > 0 || state.resizing || (dy > 0 && scrollTop <= 0);
      if (!shouldResize) return;

      if (e.cancelable) e.preventDefault();

      if (!state.resizing) {
        // first resize frame only – keep native scroll free of these costs
        disableTransition(sheet);
        setDragging(true);
      }
      state.resizing = true;
      state.didResize = true;
      const next = state.offset + dy;
      if (next <= 0) {
        state.offset = 0;
        // write transform directly – rAF adds a frame of latency on iOS
        applyOffset(sheet, 0);
        // release the gesture so later moves in this touch can be native scroll
        state.resizing = false;
      } else {
        state.offset = Math.min(next, offsets.quarter);
        applyOffset(sheet, state.offset);
        if (scroller && scroller.scrollTop) {
          scroller.scrollTop = 0;
        }
      }
    };

    const onTouchEnd = () => {
      const state = drag.current;
      drag.current = null;
      setDragging(false);

      if (!state || state.axis !== 'y' || !state.didResize) return;
      settleRef.current(
        pickSnap(state.offset, state.velocity, offsetsRef.current),
      );
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', onTouchEnd);
    sheet.addEventListener('touchcancel', onTouchEnd);

    return () => {
      sheet.classList.remove(DRAGGING_CLASS);
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
      sheet.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [sheetRef, contentRef, offsetsRef, snapRef, settleRef, draggingRef]);
};

type Props = {
  onTransitionEnd?: (
    e: React.TransitionEvent<HTMLDivElement>,
    open: boolean,
  ) => void;
  children: React.ReactNode;
  topOffset: number;
  className: string;
  /** Initial snap – feature peek uses quarter; page panels use full. */
  defaultSnap?: Snap;
  scrollRef?: Ref<HTMLDivElement>;
  /** Rendered above the scrollport (e.g. close button). */
  overlay?: React.ReactNode;
};

export const Drawer = ({
  children,
  topOffset,
  className,
  onTransitionEnd,
  defaultSnap = 'quarter',
  scrollRef,
  overlay,
}: Props) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentElRef = useRef<HTMLElement | null>(null);
  const draggingRef = useRef(false);
  const sheetHeight = useSheetHeight(sheetRef, draggingRef);
  const offsets = useMemo(() => getSnapOffsets(sheetHeight), [sheetHeight]);

  const [snap, setSnap] = useState<Snap>(defaultSnap);
  const settled = useRef(false);

  const snapRef = useRef(snap);
  snapRef.current = snap;
  const offsetsRef = useRef(offsets);
  offsetsRef.current = offsets;

  useLayoutEffect(() => {
    setDrawerSnap(snap);
    return () => setDrawerSnap(null);
  }, [snap]);

  const setContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      contentElRef.current = node;
      if (typeof scrollRef === 'function') {
        scrollRef(node);
      } else if (scrollRef) {
        (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
      }
    },
    [scrollRef],
  );

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !sheetHeight || draggingRef.current) return;

    if (!settled.current) {
      disableTransition(sheet);
      applyOffset(sheet, offsets[snap]);
      settled.current = true;
      return;
    }

    animateToOffset(sheet, offsets[snap]);
  }, [offsets, snap, sheetHeight]);

  const settle = useCallback((target: Snap) => {
    if (target !== 'full') {
      resetScroll(contentElRef.current);
    }
    // position is applied by the layout effect when `snap` changes
    setSnap(target);
  }, []);

  const settleRef = useRef(settle);
  settleRef.current = settle;

  useSheetGesture({
    sheetRef,
    contentRef: contentElRef,
    offsetsRef,
    snapRef,
    settleRef,
    draggingRef,
  });

  const onPullerTap = useCallback(() => {
    settle(nextSnapOnPullerTap(snapRef.current));
  }, [settle]);

  return (
    <Sheet
      ref={sheetRef}
      className={className}
      $topOffset={topOffset}
      onTransitionEnd={(e) => onTransitionEnd?.(e, snap !== 'quarter')}
    >
      <Puller onTap={onPullerTap} />
      {overlay != null && <Overlay>{overlay}</Overlay>}
      <Content ref={setContentRef} $lockScroll={snap !== 'full'}>
        {children}
      </Content>
    </Sheet>
  );
};

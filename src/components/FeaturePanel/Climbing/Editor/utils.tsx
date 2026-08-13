import React, { useEffect } from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';

// Elements carrying this class are excluded from react-zoom-pan-pinch panning
// (see TransformWrapper's `panning.excluded`). Dragging a route/protection
// point must move the point, never pan the photo. `isPanningDisabled` alone
// can't guarantee this: it's React state set on pointer-down, but the library
// decides whether to start a pan synchronously on the same touchstart —
// before the re-render propagates the disabled flag — so on touch it would
// still grab the gesture and cancel the drag. The library evaluates `excluded`
// synchronously against the DOM target, which closes that race.
export const PANNING_EXCLUDED_CLASS = 'climbing-no-pan';

// Shared across point clicks and background taps so a double-click can finish
// drawing even when the first click added a point and the second lands on it.
// `detail` on pointerup is 0, so we can't use the click-count from the event.
export const DRAW_DOUBLE_CLICK_MS = 350;
export const DRAW_DOUBLE_CLICK_PX = 16;
export const lastDrawAction = {
  at: 0,
  x: 0,
  y: 0,
};

export const isDrawDoubleClick = (
  clientX: number,
  clientY: number,
  now = Date.now(),
) => {
  if (!lastDrawAction.at) return false;
  const dx = clientX - lastDrawAction.x;
  const dy = clientY - lastDrawAction.y;
  return (
    now - lastDrawAction.at < DRAW_DOUBLE_CLICK_MS &&
    dx * dx + dy * dy <= DRAW_DOUBLE_CLICK_PX * DRAW_DOUBLE_CLICK_PX
  );
};

export const recordDrawAction = (clientX: number, clientY: number) => {
  lastDrawAction.at = Date.now();
  lastDrawAction.x = clientX;
  lastDrawAction.y = clientY;
};

export const clearDrawAction = () => {
  lastDrawAction.at = 0;
};

// Keeps the touch gesture of a point drag alive. On touch, the browser only
// refrains from hijacking a gesture (scroll/pan, followed by a pointercancel
// that kills the drag) if the first touchmove is preventDefault-ed.
// react-zoom-pan-pinch used to do that as a side effect of starting a pan on
// every touch, but point drags are now excluded from panning (see
// PANNING_EXCLUDED_CLASS above), and `touch-action: none` on SVG children is
// not honored reliably on mobile browsers (notably WebKit). React's own touch
// handlers are registered passive, so this must be a native non-passive
// listener. Touch events keep targeting the touchstart element for the whole
// gesture, so matching the drag-handle class is stable during the drag.
export const usePreventTouchDefaultOnDragHandles = () => {
  useEffect(() => {
    const preventDefaultOnDragHandles = (event: TouchEvent) => {
      const target = event.target;
      if (
        event.cancelable &&
        target instanceof Element &&
        target.closest(`.${PANNING_EXCLUDED_CLASS}`)
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener('touchmove', preventDefaultOnDragHandles, {
      passive: false,
    });
    return () =>
      window.removeEventListener('touchmove', preventDefaultOnDragHandles);
  }, []);
};

export const addShortcutUnderline = (message: string, shortcut: string) => {
  const shortcutUp = shortcut.toUpperCase();
  const messageUp = message.toUpperCase();

  if (messageUp.includes(shortcutUp)) {
    const position = messageUp.indexOf(shortcutUp);
    return (
      <>
        {message.substring(0, position)}
        <u>{shortcut}</u>
        {message.substring(position + 1)}
      </>
    );
  }

  return message;
};

export const useProtectionPointClickHandler = () => {
  const {
    machine,
    isPointMoving,
    isProtectionPointMoving,
    setIsProtectionPointClicked,
    setIsProtectionPointMoving,
    isProtectionPointClickedRef,
    pointWasDraggedRef,
  } = useClimbingContext();

  return (e: React.SyntheticEvent) => {
    // A finished drag must never open the menu. isPointMoving state can already
    // be reset by the SVG-level pointerup that fires alongside this release, so
    // rely on the ref, which only clears when the next gesture begins.
    if (pointWasDraggedRef.current) {
      return;
    }
    if (isPointMoving) {
      return;
    }
    if (isProtectionPointMoving) {
      return;
    }
    machine.execute('showProtectionPointMenu');

    isProtectionPointClickedRef.current = false;
    setIsProtectionPointClicked(false);
    setIsProtectionPointMoving(false);
  };
};

export const usePointClickHandler = (index: number) => {
  const {
    pointElement,
    isPointMoving,
    setPointElement,
    setPointSelectedIndex,
    setIsPointMoving,
    setIsPointClicked,
    isPointClickedRef,
    machine,
    getCurrentPath,
    pointWasDraggedRef,
  } = useClimbingContext();
  const path = getCurrentPath();

  return (e: any) => {
    // A finished drag must never open the menu — its modal backdrop would then
    // swallow the next touches and make dragging seem broken. isPointMoving
    // state can already be reset by the SVG-level pointerup firing alongside
    // this release, so rely on the ref, which only clears on the next gesture.
    if (pointWasDraggedRef.current) {
      return;
    }
    if (isPointMoving) {
      return;
    }

    isPointClickedRef.current = false;
    setIsPointClicked(false);
    setIsPointMoving(false);

    const lastPointIndex = path.length - 1;
    const isLastPoint = index === lastPointIndex;
    const isDoubleClick =
      e.detail === 2 ||
      (typeof e.clientX === 'number' &&
        isDrawDoubleClick(e.clientX, e.clientY));

    if (isLastPoint && isDoubleClick) {
      machine.execute('finishRoute');
      setPointElement(null);
      clearDrawAction();
      return;
    }

    if (typeof e.clientX === 'number') {
      recordDrawAction(e.clientX, e.clientY);
    }

    machine.execute('showPointMenu');
    setPointElement(pointElement !== null ? null : e.currentTarget);
    setPointSelectedIndex(index);
  };
};

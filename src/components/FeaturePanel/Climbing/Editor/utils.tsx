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

    setIsProtectionPointClicked(false);
    setIsProtectionPointMoving(false);
    e.stopPropagation();
    e.preventDefault();
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
    pointSelectedIndex,
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

    machine.execute('showPointMenu');
    const isDoubleClick = e.detail === 2;
    const lastPointIndex = path.length - 1;
    if (isDoubleClick && pointSelectedIndex === lastPointIndex) {
      machine.execute('finishRoute');
    }

    setPointElement(pointElement !== null ? null : e.currentTarget);
    setPointSelectedIndex(index);
    setIsPointMoving(false);
    setIsPointClicked(false);
    e.stopPropagation();
    e.preventDefault();
  };
};

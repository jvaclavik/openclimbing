import React, { useCallback } from 'react';

// The zoom/pan library listens on mouse/touch events and tends to swallow the
// synthetic `click` whenever the pointer moves even slightly (which happens
// constantly when drawing fast). Pointer events, however, reach the SVG
// reliably, so we detect a "tap" ourselves: a short press, or one that barely
// moved. Distances are in client (screen) pixels, independent of zoom.
const TAP_MAX_DURATION_MS = 250;
const TAP_MOVE_TOLERANCE_PX = 40; // a quick press may drift while tapping on the move
const TAP_STATIONARY_PX = 8; // a longer press still counts as a tap if it stays put

type Down = {
  x: number;
  y: number;
  time: number;
};

// Shared across all hook instances on purpose. Hovering a route mounts a
// highlight copy of its interactive line over the original, so the pointerdown
// is often recorded by one component instance and the pointerup arrives at the
// other (the DOM node under the cursor swaps mid-press). With per-instance
// state each copy saw only half of the gesture and the tap was lost — the
// first click on a route line didn't select it. Keying by pointerId lets any
// instance complete a tap that another one started, and also naturally guards
// against mixing up two concurrent pointers.
const downByPointer = new Map<number, Down>();

export const useTapGesture = () => {
  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.button > 0) {
      downByPointer.delete(event.pointerId);
      return;
    }
    downByPointer.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    });
  }, []);

  // Returns true when the just-finished gesture was a tap. Always call it on
  // pointerup so the stored press gets cleared.
  const endTap = useCallback((event: React.PointerEvent): boolean => {
    const down = downByPointer.get(event.pointerId);
    downByPointer.delete(event.pointerId);
    if (!down) return false;
    const dx = event.clientX - down.x;
    const dy = event.clientY - down.y;
    const dist2 = dx * dx + dy * dy;
    const duration = Date.now() - down.time;
    return (
      (duration <= TAP_MAX_DURATION_MS &&
        dist2 <= TAP_MOVE_TOLERANCE_PX * TAP_MOVE_TOLERANCE_PX) ||
      dist2 <= TAP_STATIONARY_PX * TAP_STATIONARY_PX
    );
  }, []);

  return { onPointerDown, endTap };
};

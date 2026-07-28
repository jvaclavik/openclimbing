import React, { useCallback, useRef } from 'react';

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
  pointerId: number;
};

export const useTapGesture = () => {
  const downRef = useRef<Down | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.button > 0) {
      downRef.current = null;
      return;
    }
    downRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
      pointerId: event.pointerId,
    };
  }, []);

  // Returns true when the just-finished gesture was a tap. Always call it on
  // pointerup so the stored press gets cleared.
  const endTap = useCallback((event: React.PointerEvent): boolean => {
    const down = downRef.current;
    downRef.current = null;
    if (!down || down.pointerId !== event.pointerId) return false;
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

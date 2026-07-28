import React, { useCallback, useRef } from 'react';
import { useTapGesture } from './useTapGesture';

// Fires `onTap` only for a tap that both started and ended on the empty SVG
// background (`svgRef`), so taps on points / route lines keep being handled by
// their own elements.
export const useBackgroundTap = (
  svgRef: React.MutableRefObject<any>,
  onTap: (event: React.PointerEvent) => void,
) => {
  const { onPointerDown: recordDown, endTap } = useTapGesture();
  const downOnBackgroundRef = useRef(false);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      downOnBackgroundRef.current = event.target === svgRef.current;
      recordDown(event);
    },
    [recordDown, svgRef],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const isTap = endTap(event);
      if (!isTap) return;
      if (!downOnBackgroundRef.current || event.target !== svgRef.current) {
        return;
      }
      onTap(event);
    },
    [endTap, onTap, svgRef],
  );

  return { onPointerDown, onPointerUp };
};

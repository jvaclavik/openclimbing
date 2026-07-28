import { useCallback, useEffect, useRef } from 'react';

/**
 * Coalesces rapid calls into at most one invocation per animation frame,
 * always running with the latest argument and the latest callback. Ideal for
 * pointer-move handlers that would otherwise fire (and re-render) far more
 * often than the screen refreshes.
 */
export const useRafThrottle = <T>(callback: (arg: T) => void) => {
  const rafRef = useRef<number | null>(null);
  const argRef = useRef<T | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const run = useCallback(() => {
    rafRef.current = null;
    if (argRef.current !== null) {
      callbackRef.current(argRef.current);
    }
  }, []);

  const schedule = useCallback(
    (arg: T) => {
      argRef.current = arg;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(run);
      }
    },
    [run],
  );

  const cancel = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    argRef.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
};

import { useCallback, useEffect, useState } from 'react';

// Ids of the mutually-exclusive map-control popovers (bottom-right).
export type MapControlId = 'radar' | 'accum' | 'shadow' | 'filter';

type Listener = (openId: MapControlId | null) => void;

const listeners = new Set<Listener>();
let openId: MapControlId | null = null;

const setOpenId = (id: MapControlId | null) => {
  openId = id;
  listeners.forEach((listener) => listener(openId));
};

/**
 * Coordinates the bottom-right map-control popovers so only one is open at a
 * time – opening one (e.g. radar) closes the others (filter, shadows).
 */
export const useExclusiveMapControl = (id: MapControlId) => {
  const [open, setLocalOpen] = useState(openId === id);

  useEffect(() => {
    const listener = (current: MapControlId | null) =>
      setLocalOpen(current === id);
    listeners.add(listener);
    setLocalOpen(openId === id);
    return () => {
      listeners.delete(listener);
    };
  }, [id]);

  const setOpen = useCallback(
    (value: boolean) => {
      if (value) {
        setOpenId(id);
      } else if (openId === id) {
        setOpenId(null);
      }
    },
    [id],
  );

  const toggle = useCallback(() => {
    setOpenId(openId === id ? null : id);
  }, [id]);

  return { open, setOpen, toggle };
};

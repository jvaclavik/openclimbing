import React, { useEffect, useState } from 'react';

export const useScreensize = () => {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return screenSize;
};

/**
 * Custom hook to listen for a specific keyDownEvent and trigger a callback.
 *
 * @param key - The key to listen for (e.g., "Enter", "Escape").
 * @param listener - The callback function to be invoked when the key is pressed.
 *
 * @example
 * ```typescript
 * useKeyDown('Escape', (e) => {
 *   console.log('Escape key was pressed');
 * });
 * ```
 */
export const useKeyDown = (
  key: string,
  listener: (e: KeyboardEvent) => void,
) => {
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === key) {
        listener(e);
      }
    };

    window.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener('keydown', onKeydown);
    };
  }, [key, listener]);
};

export const isTypingInFormField = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target.isContentEditable) return true;
  return false;
};

export const useFocusOnSlash = (
  inputRef: React.MutableRefObject<HTMLInputElement>,
) => {
  useKeyDown('/', (e) => {
    if (!isTypingInFormField(e.target)) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  });
};

/**
 * A custom hook that console.logs the params on every change.
 * Usefull for debugging
 */
// eslint-disable-next-line no-restricted-syntax
export const useLog = (...params: any[]) => {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(...params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...params]);
};

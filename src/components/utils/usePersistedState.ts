import { Dispatch, SetStateAction, useEffect, useState } from 'react';

const getStoredValue = (storageKey: string) =>
  JSON.parse(global?.window?.localStorage.getItem(storageKey) ?? 'null');

const storeValue = <T>(storageKey: string, value: T) =>
  window?.localStorage.setItem(storageKey, JSON.stringify(value));

export const usePersistedState = <T>(
  storageKey: string,
  init: T,
  migrate?: (stored: T) => T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setStateValue] = useState<T>(init);

  useEffect(() => {
    // we must set the localStorage value in useEffect to prevent hydration error
    const storedValue = getStoredValue(storageKey);
    if (storedValue != null) {
      const migrated = migrate ? migrate(storedValue) : storedValue;
      setStateValue(migrated);
      if (migrated !== storedValue) {
        storeValue(storageKey, migrated);
      }
    }
    // migrate is a stable module function when provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setValue = (param: (prev: T) => T | T) => {
    if (typeof param === 'function') {
      setStateValue((current) => {
        const newValue = param(current);
        storeValue(storageKey, newValue);
        return newValue;
      });
    } else {
      storeValue(storageKey, param);
      setStateValue(param);
    }
  };
  return [value, setValue];
};

import { Setter } from '../../types';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import { useInputValueState } from './options/geocoder';

const setInUrl = (value: string) => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/') return;

  const query = value ? `?q=${encodeURIComponent(value)}` : '';
  const next = `${window.location.pathname}${query}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) return;

  // replaceState (not Router.push): a Next navigation re-runs _app.getInitialProps,
  // remounts the map, dismisses the mobile keyboard and looks like a full reload.
  window.history.replaceState(window.history.state, '', next);
};

export const setUrlQuery = debounce(
  (value: string, lastSyncedValue: React.MutableRefObject<string>) => {
    setInUrl(value);
    lastSyncedValue.current = value; // we ignore this in useHandleQuery
  },
  800,
);

export const useInputValueWithUrl = () => {
  const original = useInputValueState();
  const originalSetInputValue = original.setInputValue;
  const lastSyncedValue = useRef<string | undefined>();

  const setInputValue = useCallback(
    (value: string) => {
      originalSetInputValue(value);
      setUrlQuery(value, lastSyncedValue);
    },
    [originalSetInputValue],
  );

  return {
    ...original,
    setInputValue,
    lastSyncedValue,
  };
};

export const useHandleQuery = (
  setInputValue: Setter<string>,
  setIsOpen: Setter<boolean>,
  lastSyncedValue: React.MutableRefObject<string>,
) => {
  const router = useRouter();
  useEffect(() => {
    const q = router.query.q;
    if (typeof q === 'string' && q !== lastSyncedValue.current) {
      setInputValue(q);
      setIsOpen(true);
    }
  }, [router.query.q, lastSyncedValue, setInputValue, setIsOpen]);
};

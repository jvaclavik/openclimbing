import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getPoiCategoriesStatus,
  PoiCategoriesStatus,
  setActivePoiCategories,
  subscribePoiCategoriesStatus,
} from '../Map/PoiCategories/poiCategoriesStore';
import { usePersistedState } from './usePersistedState';

type PoiCategoriesContextType = {
  activeKeys: string[];
  isActive: (key: string) => boolean;
  toggleCategory: (key: string) => void;
  clearCategories: () => void;
  status: PoiCategoriesStatus;
  /** Incremented by the search box button to open the category browser. */
  openRequest: number;
  requestOpen: () => void;
};

const PoiCategoriesContext = createContext<PoiCategoriesContextType>(undefined);

export const PoiCategoriesProvider: React.FC = ({ children }) => {
  const [activeKeys, setActiveKeys] = usePersistedState<string[]>(
    'poiCategories',
    [],
  );
  const [openRequest, setOpenRequest] = useState(0);

  const [status, setStatus] = useState(getPoiCategoriesStatus);
  useEffect(() => subscribePoiCategoriesStatus(setStatus), []);

  useEffect(() => {
    setActivePoiCategories(activeKeys);
  }, [activeKeys]);

  const toggleCategory = useCallback(
    (key: string) =>
      setActiveKeys((current) =>
        current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key],
      ),
    [setActiveKeys],
  );

  const clearCategories = useCallback(() => setActiveKeys([]), [setActiveKeys]);
  const requestOpen = useCallback(() => setOpenRequest((n) => n + 1), []);

  const value = useMemo(
    () => ({
      activeKeys,
      isActive: (key: string) => activeKeys.includes(key),
      toggleCategory,
      clearCategories,
      status,
      openRequest,
      requestOpen,
    }),
    [
      activeKeys,
      clearCategories,
      openRequest,
      requestOpen,
      status,
      toggleCategory,
    ],
  );

  return (
    <PoiCategoriesContext.Provider value={value}>
      {children}
    </PoiCategoriesContext.Provider>
  );
};

export const usePoiCategoriesContext = () => {
  const context = useContext(PoiCategoriesContext);
  if (!context) {
    throw new Error(
      'usePoiCategoriesContext must be used within a PoiCategoriesProvider',
    );
  }
  return context;
};

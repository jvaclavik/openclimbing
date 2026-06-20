import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Router, { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { Feature } from '../../services/types';
import { useBoolState } from '../helpers';
import { publishDbgObject } from '../../utils';
import { setLastFeature } from '../../services/lastFeatureStorage';
import { Setter } from '../../types';
import { clearFeatureCache, fetchFeature } from '../../services/osm/osmApi';
import { clearFetchCache } from '../../services/fetchCache';

export type FeatureContextType = {
  feature: Feature | null;
  featureShown: boolean;
  /** Used only for skeletons (otherwise it gets loaded by router) */
  setFeature: Setter<Feature | null>;
  homepageShown: boolean;
  showHomepage: () => void;
  hideHomepage: () => void;
  persistHideHomepage: () => void;
  persistShowHomepage: () => void;
  preview: Feature | null;
  setPreview: Setter<Feature | null>;
  /** Re-fetches the current feature from the OSM API and updates the panel.
   *  Pass `hard: true` to drop the whole fetch cache first (truly fresh data). */
  reloadFeature: (hard?: boolean) => Promise<void>;
  isReloading: boolean;
};

export const FeatureContext = createContext<FeatureContextType>(undefined);

interface Props {
  featureFromRouter: Feature | null;
  children: ReactNode;
  cookies: Record<string, string>;
}

export const FeatureProvider = ({
  children,
  featureFromRouter,
  cookies,
}: Props) => {
  const [preview, setPreview] = useState<Feature>(null);
  const [feature, setFeature] = useState<Feature>(featureFromRouter);
  const [isReloading, setIsReloading] = useState(false);
  const featureShown = feature != null;

  const reloadFeature = useCallback(
    async (hard = false) => {
      const apiId = feature?.osmMeta;
      if (!apiId?.id || feature.point || feature.nonOsmObject) {
        return;
      }
      setIsReloading(true);
      try {
        if (hard) {
          clearFetchCache(); // also drops Overpass / member-feature caches
        } else {
          clearFeatureCache(apiId);
        }
        const fresh = await fetchFeature(apiId);
        setFeature(fresh);
        publishDbgObject('feature', fresh);
        publishDbgObject('schema', fresh?.schema);
      } finally {
        setIsReloading(false);
      }
    },
    [feature],
  );

  useEffect(() => {
    // set feature on next.js router transition
    setFeature(featureFromRouter);
    publishDbgObject('feature', featureFromRouter);
    publishDbgObject('schema', featureFromRouter?.schema);
  }, [featureFromRouter]);

  const router = useRouter();
  const isIndex = router.pathname === '/';
  const [homepageShown, showHomepage, hideHomepage] = useBoolState(
    feature === null && isIndex && cookies.hideHomepage !== 'yes',
  );
  const persistShowHomepage = () => {
    setFeature(null);
    hideHomepage();
    Cookies.remove('hideHomepage');
    Router.push(`/${window.location.hash}`).then(() => {
      showHomepage();
    });
  };
  const persistHideHomepage = () => {
    hideHomepage();
    Cookies.set('hideHomepage', 'yes', { expires: 30, path: '/' });
  };

  if (feature) {
    setLastFeature(feature); // cleared only in onClosePanel
  }

  const value: FeatureContextType = {
    feature,
    featureShown,
    setFeature,
    homepageShown,
    showHomepage,
    hideHomepage,
    persistShowHomepage,
    persistHideHomepage,
    preview,
    setPreview,
    reloadFeature,
    isReloading,
  };

  return (
    <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>
  );
};

export const useFeatureContext = () => useContext(FeatureContext);

export type SetFeature = React.Dispatch<React.SetStateAction<Feature>>;

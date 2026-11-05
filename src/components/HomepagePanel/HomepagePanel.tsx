import React, { useEffect } from 'react';
import { useFeatureContext } from '../utils/FeatureContext';
import { useMobileMode } from '../helpers';
import { Homepage } from './Homepage';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { useRouter } from 'next/router';

/** shows conditionally on first visit
 */
export const HomepagePanel = () => {
  const { feature, homepageShown, hideHomepage, persistHideHomepage } =
    useFeatureContext();
  const isMobileMode = useMobileMode();

  const router = useRouter();
  const notIndex = router.pathname !== '/';

  // hide after first shown feature or directions box
  useEffect(() => {
    if (feature || notIndex) hideHomepage();
  }, [feature, notIndex, hideHomepage]);

  if (!homepageShown) {
    return null;
  }

  // starts as the preview strip so the map and its bottom controls stay usable
  // on phones; swiping up opens it, the close button dismisses it for good
  return (
    <MobilePageDrawer className="homepage-drawer" defaultSnap="quarter">
      <Homepage onClick={persistHideHomepage} mobileMode={isMobileMode} />
    </MobilePageDrawer>
  );
};

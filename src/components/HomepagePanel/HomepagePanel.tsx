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

  // swiping the drawer down only collapses it to the preview strip (like the
  // other pages) – the homepage is dismissed for good by the close button
  return (
    <MobilePageDrawer className="homepage-drawer">
      <Homepage onClick={persistHideHomepage} mobileMode={isMobileMode} />
    </MobilePageDrawer>
  );
};

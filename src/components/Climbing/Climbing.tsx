import { useFeatureContext } from '../utils/FeatureContext';
import Router, { useRouter } from 'next/router';
import { ClimbingContextProvider } from '../FeaturePanel/Climbing/contexts/ClimbingContext';
import { ClimbingCragDialog } from '../FeaturePanel/Climbing/ClimbingCragDialog';
import { ClimbingPdfExportDialog } from '../FeaturePanel/Climbing/ClimbingPdfExportDialog';
import React from 'react';
import { getOsmappLink, getReactKey } from '../../services/helpers';

// TODO perhaps rename this to ClimbingDialog (and the folder as well)

export const Climbing = () => {
  const { feature } = useFeatureContext();

  const router = useRouter();
  const isClimbingDialogShown = router.query.all?.[2] === 'climbing';
  const subSection = router.query.all?.[3];
  const photo = subSection === 'photo' ? router.query.all?.[4] : undefined;
  const routeNumber =
    subSection === 'route' ? router.query.all?.[4] : undefined;
  const edit = subSection === 'edit';
  const isPdfRoute = subSection === 'pdf';

  if (!isClimbingDialogShown) {
    return null;
  }

  if (isPdfRoute) {
    return (
      <ClimbingPdfExportDialog
        isOpen
        onClose={() => Router.push(getOsmappLink(feature))}
      />
    );
  }

  return (
    <ClimbingContextProvider feature={feature} key={getReactKey(feature)}>
      <ClimbingCragDialog
        photo={photo}
        routeNumber={routeNumber ? parseFloat(routeNumber) : undefined}
        edit={edit}
      />
    </ClimbingContextProvider>
  );
};

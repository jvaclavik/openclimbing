import { useFeatureContext } from '../utils/FeatureContext';
import Router, { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { ClimbingContextProvider } from '../FeaturePanel/Climbing/contexts/ClimbingContext';
import { ClimbingCragDialog } from '../FeaturePanel/Climbing/ClimbingCragDialog';
import React, { useEffect, useState } from 'react';
import { getOsmappLink, getReactKey } from '../../services/helpers';

// Heavy client-only export dialog (canvg, qrcode, jsPDF-style rendering) that is
// only shown on the `.../pdf` route, so load it lazily to keep it out of the
// shared bundle.
const ClimbingPdfExportDialog = dynamic(
  () =>
    import('../FeaturePanel/Climbing/ClimbingPdfExportDialog').then(
      (m) => m.ClimbingPdfExportDialog,
    ),
  { ssr: false },
);

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

  // Hide the PDF dialog synchronously on close. The URL change via Router.push
  // can take a moment (especially on a deep-linked load where the target page
  // re-runs getServerSideProps), and without local state the dialog stays
  // visible until the route transition finishes — looking like the X button
  // didn't react on the first click.
  const [pdfClosing, setPdfClosing] = useState(false);
  useEffect(() => {
    if (isPdfRoute) setPdfClosing(false);
  }, [isPdfRoute]);

  if (!isClimbingDialogShown) {
    return null;
  }

  if (isPdfRoute) {
    return (
      <ClimbingPdfExportDialog
        isOpen={!pdfClosing}
        onClose={() => {
          setPdfClosing(true);
          // Guard against feature being momentarily null during transitions —
          // getOsmappLink dereferences feature unconditionally and would throw.
          if (feature) {
            Router.push(getOsmappLink(feature));
          } else {
            Router.back();
          }
        }}
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

import { css, Global } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
} from '@mui/material';
import Router, { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { getOsmappLink } from '../../../services/helpers';
import { t } from '../../../services/intl';
import { useMobileMode } from '../../helpers';
import { useFeatureContext } from '../../utils/FeatureContext';
import { ClimbingCragDialogHeader } from './ClimbingCragDialogHeader';
import { ClimbingEditorHelperText } from './ClimbingEditorHelperText';
import { ClimbingPhotoEdgeSwipe } from './ClimbingPhotoEdgeSwipe';
import { ClimbingView } from './ClimbingView';
import { useClimbingContext } from './contexts/ClimbingContext';
import { useSaveCragFactory } from './useSaveCragFactory';
import { confirmDiscardUnsavedClimbingEdits } from './utils/confirmDiscardUnsavedClimbingEdits';
import { getWikimediaCommonsPhotoKeys, removeFilePrefix } from './utils/photo';
import { useEditDialogContext } from '../helpers/EditDialogContext';

const Flex = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  gap: 16px;
`;
const LeftActions = styled.div`
  flex: 1;
`;

// Inside the crag dialog the horizontal edges belong to the photo swipe, so the
// browser must not consume them for its overscroll back/forward navigation.
// GlobalStyle keeps the x axis on 'auto' elsewhere so the back gesture works in
// the rest of the app.
const noBackGestureStyle = css`
  html,
  body,
  #__next {
    overscroll-behavior-x: none;
  }
`;

export const ClimbingCragDialog = ({
  photo,
  routeNumber,
  edit,
}: {
  photo?: string;
  routeNumber?: number;
  edit?: boolean;
}) => {
  const contentRef = useRef(null);

  const {
    setScrollOffset,
    isPointMoving,
    isProtectionPointMoving,
    setIsEditMode,
    isEditMode,
    setIsPlacingProtectionPoints,
    machine,
    setRouteSelectedIndex,
    routes,
    setPhotoPath,
    photoPath,
    photoPaths,
    loadPhotoRelatedData,
    discardEdits,
    hasUnsavedEdits,
    setIsPanningDisabled,
    setIsPointClicked,
    setIsPointMoving,
    setIsProtectionPointClicked,
    setIsProtectionPointMoving,
    isPointClickedRef,
    isProtectionPointClickedRef,
  } = useClimbingContext();
  const { feature } = useFeatureContext();
  const saveCrag = useSaveCragFactory(setIsEditMode);
  const router = useRouter();
  const isMobileMode = useMobileMode();
  const { opened: isEditDialogOpened } = useEditDialogContext();
  const featureLink = getOsmappLink(feature);
  // Hide the dialog synchronously when the user clicks close. Router.push can
  // take a moment to actually unmount us (it re-runs getServerSideProps on the
  // catch-all route), and without this the X felt like it didn't respond on the
  // first click. The component remounts on each open, so no reset effect needed.
  const [closing, setClosing] = useState(false);

  // Nested EditDialog (add photo, etc.) can't receive clicks while this
  // dialog's focus trap / leftover drawing pointer state is still active.
  useEffect(() => {
    if (!isEditDialogOpened) return;
    isPointClickedRef.current = false;
    isProtectionPointClickedRef.current = false;
    setIsPointClicked(false);
    setIsPointMoving(false);
    setIsProtectionPointClicked(false);
    setIsProtectionPointMoving(false);
    setIsPanningDisabled(false);
    if (
      machine.currentStateName === 'pointMenu' ||
      machine.currentStateName === 'protectionPointMenu'
    ) {
      machine.execute('cancelPointMenu');
    }
  }, [
    isEditDialogOpened,
    isPointClickedRef,
    isProtectionPointClickedRef,
    machine,
    setIsPanningDisabled,
    setIsPointClicked,
    setIsPointMoving,
    setIsProtectionPointClicked,
    setIsProtectionPointMoving,
  ]);

  useEffect(() => {
    const tags = routes[routeNumber]?.feature?.tags || {};
    const photos = getWikimediaCommonsPhotoKeys(tags);

    if (edit) setIsEditMode(true);

    if (routeNumber !== undefined && photos?.[0]) {
      setRouteSelectedIndex(routeNumber);

      const firstPhoto = tags[photos[0]];
      const newPhotoPath = removeFilePrefix(firstPhoto);
      router.replace(`${featureLink}/climbing/photo/${newPhotoPath}`);
      setPhotoPath(newPhotoPath);
    } else if (photo) {
      setPhotoPath(photo);
    } else if (!photoPath && photoPaths?.length > 0) {
      setPhotoPath(photoPaths[0]);
      if (routeNumber !== undefined) setRouteSelectedIndex(routeNumber);
    }
  }, [
    edit,
    featureLink,
    photo,
    photoPath,
    photoPaths,
    routeNumber,
    router,
    routes,
    setIsEditMode,
    setPhotoPath,
    setRouteSelectedIndex,
  ]);

  const onScroll = (e) => {
    setScrollOffset({
      x: e.target.scrollLeft,
      y: e.target.scrollTop,
      units: 'px',
    });
  };

  const handleClose = () => {
    if (
      isEditMode &&
      window.confirm(
        'Are you sure you want to close this window? You might loose your changes.',
      ) === false
    ) {
      return;
    }

    setClosing(true);
    if (feature) {
      Router.push(`${getOsmappLink(feature)}${window.location.hash}`);
    } else {
      Router.back();
    }
  };
  const handleCancel = () => {
    if (!confirmDiscardUnsavedClimbingEdits(hasUnsavedEdits)) {
      return;
    }
    discardEdits();
    // Reset UI/machine state so "cancel" leaves editor in a consistent non-edit mode.
    setIsPlacingProtectionPoints(false);
    if (machine.currentStateName === 'extendRoute') {
      machine.execute('finishRoute');
    }
    if (
      machine.currentStateName === 'pointMenu' ||
      machine.currentStateName === 'protectionPointMenu'
    ) {
      machine.execute('cancelPointMenu');
    }
    setIsEditMode(false);
    setTimeout(() => {
      loadPhotoRelatedData();
    });
  };

  return (
    <Dialog
      fullScreen
      open={!closing}
      onClose={(_event, reason) => {
        if (isEditMode && reason === 'escapeKeyDown') return;
        handleClose();
      }}
      disableEnforceFocus={isEditDialogOpened}
      disableAutoFocus={isEditDialogOpened}
      disableRestoreFocus={isEditDialogOpened}
      slotProps={{
        paper: {
          elevation: 0,
        },
      }}
    >
      <Global styles={noBackGestureStyle} />
      <ClimbingPhotoEdgeSwipe />
      <ClimbingCragDialogHeader
        onClose={handleClose}
        onSave={saveCrag}
        onCancel={handleCancel}
      />

      <DialogContent
        dividers
        style={{
          overscrollBehavior:
            isPointMoving || isProtectionPointMoving ? 'none' : undefined,
          padding: 0,
        }}
        ref={contentRef}
        onScroll={onScroll}
      >
        <ClimbingView />
      </DialogContent>

      {isEditMode && !isMobileMode && (
        <DialogActions>
          <Flex>
            <LeftActions>
              <Stack
                spacing={1}
                sx={{
                  alignItems: 'flex-start',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ClimbingEditorHelperText />
                </div>
              </Stack>
            </LeftActions>
            <div>
              <Stack spacing={2} direction="row">
                <Button onClick={handleCancel}>
                  {t('editdialog.cancel_button')}
                </Button>

                <Button onClick={saveCrag} variant="contained" color="primary">
                  {t('editdialog.save_button_edit')}
                </Button>
              </Stack>
            </div>
          </Flex>
        </DialogActions>
      )}
    </Dialog>
  );
};

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { SwipeableDrawer, useMediaQuery } from '@mui/material';
import { isDesktop, useBoolState } from '../helpers';
import { LayerSwitcherButton } from './LayerSwitcherButton';
import { LayerSwitcherContent } from './LayerSwitcherContent';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  LAYERS_DRAWER_Z,
  setLayersPanelOpen,
} from '../utils/mapChromeRegistry';

const ButtonSlot = styled.div`
  pointer-events: all;
`;

export const useLayerSwitcherShortcuts = (onClose: () => void) => {
  useEffect(() => {
    const downHandler = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', downHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [onClose]);
};

const LayerSwitcher = () => {
  const [opened, open, close] = useBoolState(false);
  const panelFixed = useMediaQuery(isDesktop);
  useLayerSwitcherShortcuts(close);

  useEffect(() => {
    setLayersPanelOpen(opened);
    return () => setLayersPanelOpen(false);
  }, [opened]);

  // Portal so the panel is never trapped under/over icons inside BottomRight
  // (persistent drawers inherit their parent's stacking context otherwise).
  const drawer =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <SwipeableDrawer
            anchor="right"
            open={opened}
            onClose={close}
            onOpen={open}
            variant={panelFixed ? 'persistent' : 'temporary'}
            disableBackdropTransition
            disableSwipeToOpen
            sx={{ zIndex: LAYERS_DRAWER_Z, pointerEvents: 'all' }}
            ModalProps={{ sx: { zIndex: LAYERS_DRAWER_Z } }}
            PaperProps={{ sx: { zIndex: LAYERS_DRAWER_Z } }}
          >
            <div role="presentation" style={{ width: '280px', height: '100%' }}>
              <ClosePanelButton right onClick={close} style={{ top: 13 }} />
              {/* unmount when closed – persistent desktop drawer otherwise keeps the full tree */}
              {opened && <LayerSwitcherContent />}
            </div>
          </SwipeableDrawer>,
          document.body,
        );

  return (
    <>
      <ButtonSlot>
        <LayerSwitcherButton
          onClick={opened ? close : open}
          isOpened={opened}
        />
      </ButtonSlot>
      {drawer}
    </>
  );
};

export default LayerSwitcher; // default-export needed by dynamic-import

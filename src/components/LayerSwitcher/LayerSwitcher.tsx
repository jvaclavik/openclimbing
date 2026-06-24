import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { SwipeableDrawer, useMediaQuery } from '@mui/material';
import { isDesktop, useBoolState } from '../helpers';
import { LayerSwitcherButton } from './LayerSwitcherButton';
import { LayerSwitcherContent } from './LayerSwitcherContent';
import { ClosePanelButton } from '../utils/ClosePanelButton';

// Keep the toggle button above the (desktop, persistent) drawer paper so it
// stays visible and clickable to close the sidebar again.
const ButtonAboveDrawer = styled.div`
  position: relative;
  z-index: 1300;
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

  return (
    <div>
      <ButtonAboveDrawer>
        <LayerSwitcherButton
          onClick={opened ? close : open}
          isOpened={opened}
        />
      </ButtonAboveDrawer>
      <SwipeableDrawer
        anchor="right"
        open={opened}
        onClose={close}
        onOpen={open}
        variant={panelFixed ? 'persistent' : 'temporary'}
        disableBackdropTransition
        disableSwipeToOpen
        sx={{ pointerEvents: 'all' }}
      >
        <div role="presentation" style={{ width: '280px', height: '100%' }}>
          <ClosePanelButton right onClick={close} style={{ top: 13 }} />
          <LayerSwitcherContent />
        </div>
      </SwipeableDrawer>
    </div>
  );
};

export default LayerSwitcher; // default-export needed by dynamic-import

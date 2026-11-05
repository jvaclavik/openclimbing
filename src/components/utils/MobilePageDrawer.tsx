import React from 'react';
import { Drawer } from './Drawer';
import { PanelWrapper } from './PanelHelpers';
import { useMobileMode } from '../helpers';
import { Snap } from './drawerSnap';

export const DRAWER_PREVIEW_PADDING = 24;
export const DRAWER_PREVIEW_HEIGHT = 62 + DRAWER_PREVIEW_PADDING;
export const DRAWER_TOP_OFFSET = 8;

type MobilePageDrawerProps = {
  children: React.ReactNode;
  onClose?: (e: React.TransitionEvent<HTMLDivElement>, open: boolean) => void;
  className: string;
  topOffset?: number;
  defaultSnap?: Snap;
};

export const MobilePageDrawer = ({
  children,
  onClose,
  className,
  topOffset = DRAWER_TOP_OFFSET,
  defaultSnap = 'full',
}: MobilePageDrawerProps) => {
  const isMobileMode = useMobileMode();

  return isMobileMode ? (
    <Drawer
      topOffset={topOffset}
      className={className}
      onTransitionEnd={onClose}
      defaultSnap={defaultSnap}
    >
      {children}
    </Drawer>
  ) : (
    <PanelWrapper>{children}</PanelWrapper>
  );
};

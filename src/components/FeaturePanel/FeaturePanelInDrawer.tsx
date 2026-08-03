import React, { Ref, useCallback } from 'react';
import Router from 'next/router';
import { FeaturePanel } from './FeaturePanel';
import { FeaturePanelErrorBoundary } from './FeaturePanelErrorBoundary';
import { Drawer } from '../utils/Drawer';
import { DRAWER_TOP_OFFSET } from '../utils/MobilePageDrawer';
import { useFeatureContext } from '../utils/FeatureContext';
import { setLastFeature } from '../../services/lastFeatureStorage';

const DRAWER_CLASSNAME = 'featurePanelInDrawer';

type FeaturePanelInDrawerProps = {
  scrollRef: Ref<HTMLDivElement>;
};

export const FeaturePanelInDrawer = ({
  scrollRef,
}: FeaturePanelInDrawerProps) => {
  const { setFeature } = useFeatureContext();

  const onClose = useCallback(() => {
    setFeature(null);
    Router.push(`/${window.location.hash}`);
    setLastFeature(null);
  }, [setFeature]);

  return (
    <Drawer
      topOffset={DRAWER_TOP_OFFSET}
      className={DRAWER_CLASSNAME}
      scrollRef={scrollRef}
    >
      <FeaturePanelErrorBoundary>
        <FeaturePanel onClose={onClose} />
      </FeaturePanelErrorBoundary>
    </Drawer>
  );
};

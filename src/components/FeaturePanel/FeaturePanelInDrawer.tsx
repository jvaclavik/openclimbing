import { useState, useRef, useEffect, useCallback } from 'react';
import React, { Ref } from 'react';
import Router from 'next/router';
import { FeaturePanel } from './FeaturePanel';
import { FeaturePanelErrorBoundary } from './FeaturePanelErrorBoundary';
import { Drawer } from '../utils/Drawer';
import {
  DRAWER_PREVIEW_HEIGHT,
  DRAWER_PREVIEW_PADDING,
  DRAWER_TOP_OFFSET,
} from '../utils/MobilePageDrawer';
import { useScreensize } from '../../helpers/hooks';
import { useFeatureContext } from '../utils/FeatureContext';
import { setLastFeature } from '../../services/lastFeatureStorage';

const DRAWER_CLASSNAME = 'featurePanelInDrawer';

type FeaturePanelInDrawerProps = {
  scrollRef: Ref<HTMLDivElement>;
};

export const FeaturePanelInDrawer = ({
  scrollRef,
}: FeaturePanelInDrawerProps) => {
  const { feature, setFeature } = useFeatureContext();
  const [collapsedHeight, setCollapsedHeight] = useState<number>(
    DRAWER_PREVIEW_HEIGHT,
  );
  const { height: windowHeight } = useScreensize();
  const maxCollapsedHeight = windowHeight / 3;

  const headingRef = useRef<HTMLDivElement>();

  useEffect(() => {
    const headingDiv = headingRef.current;
    if (!headingDiv) return;

    const baseHeight = Math.min(headingDiv.clientHeight, maxCollapsedHeight);
    setCollapsedHeight(baseHeight + DRAWER_PREVIEW_PADDING - 30);
  }, [headingRef, feature, maxCollapsedHeight]);

  const onDismiss = useCallback(() => {
    setFeature(null);
    Router.push(`/${window.location.hash}`);
    setLastFeature(null);
  }, [setFeature]);

  return (
    <Drawer
      key={`drawer-${collapsedHeight}px`}
      topOffset={DRAWER_TOP_OFFSET}
      className={DRAWER_CLASSNAME}
      collapsedHeight={collapsedHeight}
      scrollRef={scrollRef}
      onDismiss={onDismiss}
    >
      <FeaturePanelErrorBoundary>
        <FeaturePanel headingRef={headingRef} />
      </FeaturePanelErrorBoundary>
    </Drawer>
  );
};

import Router from 'next/router';
import React, { Ref } from 'react';

import { setLastFeature } from '../../services/lastFeatureStorage';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { useFeatureContext } from '../utils/FeatureContext';
import { PanelScrollbars, PanelWrapper } from '../utils/PanelHelpers';
import { FeaturePanel } from './FeaturePanel';
import { FeaturePanelErrorBoundary } from './FeaturePanelErrorBoundary';

type FeaturePanelOnSideProps = {
  scrollRef: Ref<HTMLDivElement>;
};

const useOnClosePanel = () => {
  const { setFeature } = useFeatureContext();

  return () => {
    setFeature(null);
    Router.push(`/${window.location.hash}`);
    setLastFeature(null);
  };
};

export const FeaturePanelOnSide = ({ scrollRef }: FeaturePanelOnSideProps) => {
  const onClosePanel = useOnClosePanel();

  return (
    <PanelWrapper>
      <PanelScrollbars scrollRef={scrollRef}>
        <ClosePanelButton right onClick={onClosePanel} />
        <FeaturePanelErrorBoundary>
          <FeaturePanel />
        </FeaturePanelErrorBoundary>
      </PanelScrollbars>
    </PanelWrapper>
  );
};

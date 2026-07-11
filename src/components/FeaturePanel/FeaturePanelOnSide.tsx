import React, { LegacyRef } from 'react';

import { PanelScrollbars, PanelWrapper } from '../utils/PanelHelpers';
import { FeaturePanel } from './FeaturePanel';
import { FeaturePanelErrorBoundary } from './FeaturePanelErrorBoundary';
import { Scrollbars } from 'react-custom-scrollbars';

type FeaturePanelOnSideProps = {
  scrollRef: LegacyRef<Scrollbars>;
};

export const FeaturePanelOnSide = ({ scrollRef }: FeaturePanelOnSideProps) => {
  return (
    <PanelWrapper>
      <PanelScrollbars scrollRef={scrollRef}>
        <FeaturePanelErrorBoundary>
          <FeaturePanel />
        </FeaturePanelErrorBoundary>
      </PanelScrollbars>
    </PanelWrapper>
  );
};

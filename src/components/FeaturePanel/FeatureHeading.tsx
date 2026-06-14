import React from 'react';
import styled from '@emotion/styled';
import { useMediaQuery } from '@mui/material';
import { PoiDescription } from './helpers/PoiDescription';
import { getLabel, getSecondaryLabel } from '../../helpers/featureLabel';
import { useFeatureContext } from '../utils/FeatureContext';
import { QuickActions } from './QuickActions/QuickActions';
import { PROJECT_ID } from '../../services/project';
import { css } from '@emotion/react';

const Container = styled.div<{ isStandalone: boolean }>`
  margin: 20px 0 20px 0;
  ${({ isStandalone }) => isStandalone && 'padding-bottom: 8px;'}
`;

const HeadingsWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-bottom: 8px;
`;

const Headings = () => {
  const isOpenClimbing = PROJECT_ID === 'openclimbing';

  const { feature } = useFeatureContext();
  const label = getLabel(feature);
  const secondaryLabel = getSecondaryLabel(feature);
  return (
    <HeadingsWrapper>
      <Heading $deleted={feature?.deleted} $isOpenClimbing={isOpenClimbing}>
        {label}
      </Heading>
      {secondaryLabel && (
        <SecondaryHeading
          $deleted={feature?.deleted}
          $isOpenClimbing={isOpenClimbing}
        >
          {secondaryLabel}
        </SecondaryHeading>
      )}
    </HeadingsWrapper>
  );
};

const Heading = styled.h1<{ $deleted: boolean; $isOpenClimbing: boolean }>`
  font-size: 36px;
  line-height: 1.1;
  ${({ $isOpenClimbing }) =>
    $isOpenClimbing &&
    css`
      font-family: 'Piazzolla', sans-serif;
      font-weight: 900;
      font-size: 46px;
    `}
  margin: 0;
  ${({ $deleted }) => $deleted && 'text-decoration: line-through;'}
`;
const SecondaryHeading = styled.h2<{
  $deleted: boolean;
  $isOpenClimbing: boolean;
}>`
  font-size: 24px;
  line-height: 0.98;
  ${({ $isOpenClimbing }) =>
    $isOpenClimbing &&
    css`
      font-family: 'Piazzolla', sans-serif;
      font-weight: 900;
    `}
  margin: 0;
  ${({ $deleted }) => $deleted && 'text-decoration: line-through;'}
`;

export const FeatureHeading = React.forwardRef<HTMLDivElement>((_, ref) => {
  // thw pwa needs space at the bottom
  const isStandalone = useMediaQuery('(display-mode: standalone)');

  return (
    <Container ref={ref} isStandalone={isStandalone}>
      <Headings />
      <PoiDescription />

      <QuickActions />
    </Container>
  );
});
FeatureHeading.displayName = 'FeatureHeading';

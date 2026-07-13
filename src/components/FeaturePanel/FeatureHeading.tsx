import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Stack, Typography, useMediaQuery } from '@mui/material';
import React from 'react';
import { getLabel, getSecondaryLabel } from '../../helpers/featureLabel';
import { PROJECT_ID } from '../../services/project';
import { useMobileMode } from '../helpers';
import { useFeatureContext } from '../utils/FeatureContext';
import { PoiDescription } from './helpers/PoiDescription';
import { QuickActions } from './QuickActions/QuickActions';
import { OfflineBadge } from '../App/OfflineBadge';

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
      <Typography
        variant="h1"
        sx={{ textDecoration: feature?.deleted ? 'line-through' : 'none' }}
      >
        {label}
      </Typography>
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

  const isMobileMode = useMobileMode();

  return (
    <Container ref={ref} isStandalone={isStandalone}>
      <OfflineBadge sx={{ mb: 1 }} />
      <Stack
        direction={isMobileMode ? 'column-reverse' : 'column'}
        marginTop={4}
      >
        <PoiDescription />
        <Headings />
      </Stack>
      <QuickActions />
    </Container>
  );
});
FeatureHeading.displayName = 'FeatureHeading';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';
import { getLabel, getSecondaryLabel } from '../../helpers/featureLabel';
import { PROJECT_ID } from '../../services/project';
import { useMobileMode } from '../helpers';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { PANEL_GAP } from '../utils/PanelHelpers';
import { useFeatureContext } from '../utils/FeatureContext';
import { PoiDescription } from './helpers/PoiDescription';
import { QuickActions } from './QuickActions/QuickActions';

const Container = styled.div<{ $isStandalone: boolean; $compact?: boolean }>`
  margin: ${({ $compact }) => ($compact ? '0 0 16px' : '20px 0')};
  ${({ $isStandalone }) => $isStandalone && 'padding-bottom: 8px;'}
`;

const StickyTitle = styled.div`
  position: sticky;
  top: 0;
  z-index: 3;
  flex-shrink: 0;
  padding: 0 ${PANEL_GAP} 4px;
  // same solid as Drawer Sheet so scroll-under content can't tint the title
  background: ${({ theme }) => theme.palette.background.paper};
`;

const HeadingsWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  margin-bottom: 8px;
`;

const TitleRow = ({ onClose }: { onClose?: () => void }) => {
  const isMobileMode = useMobileMode();
  const theme = useTheme();
  const { feature } = useFeatureContext();
  const label = getLabel(feature);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography
        variant="h1"
        sx={{
          flex: 1,
          minWidth: 0,
          textDecoration: feature?.deleted ? 'line-through' : 'none',
          ...(isMobileMode && {
            fontSize: 32,
            lineHeight: 1.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }),
        }}
      >
        {label}
      </Typography>
      {isMobileMode && onClose && (
        <ClosePanelButton
          onClick={onClose}
          style={{
            flexShrink: 0,
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.secondary,
          }}
        />
      )}
    </Stack>
  );
};

/** Sticky title bar – must be a direct child of the scrolling column, not nested
 *  inside a short heading wrapper (sticky can't escape its parent's height). */
export const FeatureStickyTitle = ({ onClose }: { onClose?: () => void }) => (
  <StickyTitle>
    <TitleRow onClose={onClose} />
  </StickyTitle>
);

const Headings = () => {
  const isOpenClimbing = PROJECT_ID === 'openclimbing';
  const isMobileMode = useMobileMode();
  const { feature } = useFeatureContext();
  const secondaryLabel = getSecondaryLabel(feature);

  return (
    <HeadingsWrapper>
      {!isMobileMode && <TitleRow />}
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

type FeatureHeadingProps = {
  headingRef?: React.Ref<HTMLDivElement>;
};

export const FeatureHeading = ({ headingRef }: FeatureHeadingProps) => {
  // thw pwa needs space at the bottom
  const isStandalone = useMediaQuery('(display-mode: standalone)');
  const isMobileMode = useMobileMode();

  return (
    <Container
      ref={headingRef}
      $isStandalone={isStandalone}
      $compact={isMobileMode}
    >
      {isMobileMode ? (
        <>
          <Headings />
          <PoiDescription />
        </>
      ) : (
        <Stack direction="column" marginTop={4}>
          <PoiDescription />
          <Headings />
        </Stack>
      )}
      <QuickActions />
    </Container>
  );
};

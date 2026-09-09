import styled from '@emotion/styled';
import React from 'react';
import { useMobileMode } from '../../helpers';
import { QUARTER_PEEK_PX } from '../../utils/drawerSnap';
import { FEATURE_PANEL_WIDTH } from '../../utils/PanelHelpers';
import { useMapChrome } from '../../utils/mapChromeRegistry';
import { usePanelShown } from '../../utils/usePanelShown';

const INSET = 2;

const Container = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  padding: ${INSET}px;
  gap: ${INSET}px;
  pointer-events: none;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transform: translate3d(${({ $x }) => $x}px, ${({ $y }) => -$y}px, 0);
`;

export const MapAttributionChrome = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isMobile = useMobileMode();
  const panelShown = usePanelShown();
  const { drawerPeek } = useMapChrome();

  const x = !isMobile && panelShown ? FEATURE_PANEL_WIDTH : 0;
  const y = drawerPeek ? QUARTER_PEEK_PX : 0;

  return (
    <Container $x={x} $y={y}>
      {children}
    </Container>
  );
};

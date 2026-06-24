import React from 'react';
import styled from '@emotion/styled';

import { Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ROUTE_HIGHLIGHT_COLOR } from '../../utils/icons/PoiIcon';

const Container = styled.div`
  position: relative;
`;
const TickCheckContainer = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 12px;
`;

const Circle = styled.div<{
  $hasCircle: boolean;
  $highlighted?: boolean;
}>`
  width: 20px;
  height: 20px;
  line-height: 20px;
  border-radius: 50%;
  background: ${({ theme, $hasCircle }) =>
    $hasCircle ? theme.palette.climbing.primary : undefined};
  color: ${({ theme, $hasCircle }) =>
    $hasCircle ? theme.palette.climbing.secondary : '#999'};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  transition: all 0.15s ease;
  transform: ${({ $highlighted }) => ($highlighted ? 'scale(1.25)' : 'none')};
  box-shadow: ${({ $highlighted }) =>
    $highlighted ? `0 0 0 3px ${ROUTE_HIGHLIGHT_COLOR}` : 'none'};
`;

export const RouteNumber = ({
  children,
  hasCircle = false,
  hasTick = false,
  hasTooltip = true,
  highlighted = false,
}) => {
  const getTitle = () => {
    if (hasTick) {
      return 'You ticked this route';
    }
    if (hasCircle) {
      return 'Route has marked path';
    }
    return 'Route has no marked path';
  };

  return (
    <Tooltip arrow title={hasTooltip ? getTitle() : null}>
      <Container>
        <Circle $hasCircle={hasCircle} $highlighted={highlighted}>
          {children}
        </Circle>
        {hasTick && (
          <TickCheckContainer>
            <CheckCircleIcon color="success" fontSize="inherit" />
          </TickCheckContainer>
        )}
      </Container>
    </Tooltip>
  );
};

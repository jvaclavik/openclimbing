import React from 'react';
import styled from '@emotion/styled';

import { Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Container = styled.div`
  position: relative;
`;
const TickCheckContainer = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 12px;
`;

// Matches the route markers in the position editor / on the photo: a circle
// filled with the route's difficulty colour, a white border, and the order
// number inside. `$color` is the difficulty colour (falls back to grey when the
// route has no grade).
const Circle = styled.div<{
  $color?: string;
  $highlighted?: boolean;
}>`
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  box-sizing: border-box;
  background: ${({ $color }) => $color ?? '#555'};
  color: ${({ theme, $color }) =>
    theme.palette.getContrastText($color ?? '#555')};
  border: 1px solid
    ${({ theme, $color }) => theme.palette.getContrastText($color ?? '#555')};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.15s ease;
  transform: ${({ $highlighted }) => ($highlighted ? 'scale(1.25)' : 'none')};
`;

// Routes that are not drawn on any photo get just the bare number — no circle,
// no colour — but keep the exact size, position and font of the circled badge
// so the list stays aligned.
const PlainNumber = styled.div<{
  $highlighted?: boolean;
}>`
  width: 22px;
  height: 22px;
  line-height: 22px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.15s ease;
  transform: ${({ $highlighted }) => ($highlighted ? 'scale(1.25)' : 'none')};
`;

export const RouteNumber = ({
  children,
  color,
  hasCircle = false,
  hasTick = false,
  hasTooltip = true,
  highlighted = false,
}: {
  children: React.ReactNode;
  color?: string;
  hasCircle?: boolean;
  hasTick?: boolean;
  hasTooltip?: boolean;
  highlighted?: boolean;
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
        {hasCircle ? (
          <Circle $color={color} $highlighted={highlighted}>
            {children}
          </Circle>
        ) : (
          <PlainNumber $highlighted={highlighted}>{children}</PlainNumber>
        )}
        {hasTick && (
          <TickCheckContainer>
            <CheckCircleIcon color="success" fontSize="inherit" />
          </TickCheckContainer>
        )}
      </Container>
    </Tooltip>
  );
};

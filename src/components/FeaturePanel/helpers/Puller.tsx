import styled from '@emotion/styled';
import React from 'react';

const HANDLE_WIDTH = 40;
const HANDLE_HEIGHT = 4;

const Handle = styled.div`
  width: ${HANDLE_WIDTH}px;
  height: ${HANDLE_HEIGHT}px;
  border-radius: 999px;
  background-color: ${({ theme }) =>
    theme.palette.mode === 'light'
      ? 'rgba(0, 0, 0, 0.18)'
      : 'rgba(255, 255, 255, 0.28)'};
  -webkit-tap-highlight-color: transparent;
`;

const PullerContainer = styled.button`
  all: unset;
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  // tight so the collapsed peek can be title-sized
  padding: 6px 0 2px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

type Props = {
  onTap: () => void;
};

export const Puller = ({ onTap }: Props) => (
  <PullerContainer type="button" aria-label="Resize panel" onClick={onTap}>
    <Handle />
  </PullerContainer>
);

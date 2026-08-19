import styled from '@emotion/styled';
import { alpha } from '@mui/material/styles';
import React, { useState } from 'react';
import { getEditTabDragShortId, isEditTabDrag } from './editItemDnd';

const Zone = styled.div<{ $active: boolean }>`
  border-radius: 8px;
  outline: 2px dashed
    ${({ $active, theme }) =>
      $active ? theme.palette.primary.main : 'transparent'};
  background: ${({ $active, theme }) =>
    $active ? alpha(theme.palette.primary.main, 0.08) : 'transparent'};
  transition:
    background 0.12s ease-out,
    outline-color 0.12s ease-out;
`;

type Props = {
  children: React.ReactNode;
  onDropShortId: (shortId: string) => void | Promise<void>;
};

export const EditTabDropZone = ({ children, onDropShortId }: Props) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <Zone
      $active={isOver}
      onDragOver={(e) => {
        if (!isEditTabDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOver(false);
        }
      }}
      onDrop={async (e) => {
        setIsOver(false);
        const shortId = getEditTabDragShortId(e.dataTransfer);
        if (!shortId) return;
        e.preventDefault();
        await onDropShortId(shortId);
      }}
    >
      {children}
    </Zone>
  );
};

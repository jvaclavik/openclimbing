import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import React from 'react';
import { getViaFerrataScaleRangeColor } from '../../services/tagging/viaFerrataScale';

const Chip = styled.span<{ $color: string }>`
  flex-shrink: 0;
  border-radius: 12px;
  padding: 2px 8px;
  background-color: ${({ $color }) => $color};
  font-size: 12px;
  font-weight: 900;
  line-height: 1.3;
  color: ${({ theme, $color }) => theme.palette.getContrastText($color)};
  font-family: monospace;
`;

export const ViaFerrataScaleChip = ({ scale }: { scale: string }) => {
  const theme = useTheme();
  const color =
    getViaFerrataScaleRangeColor(scale, theme.palette.mode) ?? '#555';
  return <Chip $color={color}>{scale}</Chip>;
};

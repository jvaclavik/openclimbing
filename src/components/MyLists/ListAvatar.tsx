import React from 'react';
import { Box } from '@mui/material';
import { DEFAULT_LIST_COLOR } from '../../services/my-lists/listColors';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = { xs: 20, sm: 28, md: 34, lg: 46 };
const EMOJI_PX: Record<Size, number> = { xs: 12, sm: 17, md: 20, lg: 26 };

type Props = {
  emoji?: string;
  color?: string;
  size?: Size;
};

export const ListAvatar = ({ emoji, color, size = 'sm' }: Props) => {
  const px = SIZE_PX[size];
  const emojiPx = EMOJI_PX[size];
  const bg = color?.trim() || DEFAULT_LIST_COLOR;
  const text = emoji?.trim() ?? '';

  return (
    <Box
      sx={{
        width: px,
        height: px,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: emojiPx,
        lineHeight: 1,
        border: '1px solid rgba(0,0,0,0.2)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        flexShrink: 0,
      }}
    >
      {text}
    </Box>
  );
};

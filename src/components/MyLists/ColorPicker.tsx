import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { LIST_COLOR_PALETTE } from '../../services/my-lists/listColors';
import { t } from '../../services/intl';

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export const ColorPicker = ({ value, onChange }: Props) => (
  <Stack direction="column" gap={0.75}>
    <Typography variant="caption" color="text.secondary">
      {t('mylists.color_placeholder')}
    </Typography>
    <Box display="flex" flexWrap="wrap" gap={0.75}>
      {LIST_COLOR_PALETTE.map((color) => {
        const selected = value === color;
        return (
          <Box
            key={color}
            role="button"
            aria-label={color}
            onClick={() => onChange(color)}
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: color,
              cursor: 'pointer',
              outline: selected
                ? '2px solid #000'
                : '1px solid rgba(0,0,0,0.2)',
              outlineOffset: selected ? 2 : 0,
              transition: 'transform 0.1s',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          />
        );
      })}
    </Box>
  </Stack>
);

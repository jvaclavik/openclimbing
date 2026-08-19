import { Box } from '@mui/material';
import React from 'react';

export const EditSectionCard = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <Box
    sx={(theme) => ({
      my: 2,
      borderRadius: 1,
      overflow: 'hidden',
      border: `1px solid ${theme.palette.divider}`,
      bgcolor:
        theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(0,0,0,0.02)',
    })}
  >
    {children}
  </Box>
);

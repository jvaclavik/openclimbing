import { Typography } from '@mui/material';
import React from 'react';

export const Subheading = ({ children }) => (
  <Typography
    variant="overline"
    color="textSecondary"
    sx={{
      display: 'block',
    }}
  >
    {children}
  </Typography>
);

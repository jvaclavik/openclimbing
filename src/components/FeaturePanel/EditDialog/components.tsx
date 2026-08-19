import React from 'react';

import { Typography } from '@mui/material';

export const DialogHeading = ({ children }) => (
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

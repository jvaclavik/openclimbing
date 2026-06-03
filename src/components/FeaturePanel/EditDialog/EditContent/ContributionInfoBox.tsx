import { Box, Typography } from '@mui/material';
import React from 'react';
import { Translation } from '../../../../services/intl';

export const ContributionInfoBox = () => (
  <Box mt={1} mb={2}>
    <Typography variant="body2" color="textSecondary">
      <Translation id="editdialog.info_edit" />
    </Typography>
  </Box>
);

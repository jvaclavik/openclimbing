import React from 'react';
import { Alert, Button, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { t } from '../../../../services/intl';
import { useCurrentItem } from '../context/EditContext';
import { useOpenClimbingWebsite } from '../useOpenClimbingWebsite';

export const OpenClimbingWebsiteBanner = () => {
  const { isActive, item, optOut, setOptOut } = useOpenClimbingWebsite();
  const { shortId } = useCurrentItem();

  if (!isActive || item.shortId !== shortId) {
    return null;
  }

  return (
    <Alert
      severity="info"
      variant="outlined"
      icon={<LinkIcon fontSize="inherit" />}
      sx={{
        mb: 1,
        py: 0,
        border: 0,
        color: 'text.secondary',
        alignItems: 'center',
        '& .MuiAlert-icon': { color: 'text.secondary', opacity: 0.7 },
      }}
      action={
        <Button color="inherit" size="small" onClick={() => setOptOut(!optOut)}>
          {optOut
            ? t('editdialog.openclimbing_link_optin_button')
            : t('editdialog.openclimbing_link_optout_button')}
        </Button>
      }
    >
      <Typography variant="caption" component="span">
        {optOut
          ? t('editdialog.openclimbing_link_optout_info')
          : t('editdialog.openclimbing_link_info')}
      </Typography>
    </Alert>
  );
};

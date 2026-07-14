import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { t } from '../../services/intl';
import { useOnlineStatus } from '../../services/offline/useOnlineStatus';

// Small, inline "Offline" chip for dialog headers — shown only while offline.
// Not a fixed/floating banner (see the removed OfflineIndicator).
export const OfflineBadge = ({ sx }: { sx?: object }) => {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <Tooltip title={t('offline.you_are_offline')}>
      <Chip
        size="small"
        variant="outlined"
        color="warning"
        icon={<CloudOffIcon />}
        label="Offline"
        sx={sx}
      />
    </Tooltip>
  );
};

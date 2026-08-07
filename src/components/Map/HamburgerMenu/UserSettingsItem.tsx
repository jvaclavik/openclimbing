import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { t } from '../../../services/intl';
import SettingsIcon from '@mui/icons-material/Settings';

type UserSettingsItemProps = {
  openUserSettings: () => void;
};

export const UserSettingsItem = ({
  openUserSettings,
}: UserSettingsItemProps) => (
  <Tooltip title={t('user.user_settings')}>
    <IconButton onClick={openUserSettings}>
      <SettingsIcon />
    </IconButton>
  </Tooltip>
);

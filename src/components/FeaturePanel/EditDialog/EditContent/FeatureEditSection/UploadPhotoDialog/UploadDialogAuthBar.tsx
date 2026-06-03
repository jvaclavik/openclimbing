import React from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { t, Translation } from '../../../../../../services/intl';
import { useWikimediaCommonsAuthContext } from '../../../../../utils/WikimediaCommonsAuthContext';

export const UploadDialogAuthBar: React.FC = () => {
  const { loggedIn, user, loading, handleLogin, handleLogout } =
    useWikimediaCommonsAuthContext();

  if (loggedIn) {
    return (
      <Alert
        severity="success"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            {t('uploaddialog.logout')}
          </Button>
        }
      >
        <Translation
          id="uploaddialog.logged_in_as"
          values={{ user: user?.username ?? '' }}
        />
      </Alert>
    );
  }

  return (
    <Alert
      severity="info"
      action={
        <Button
          color="inherit"
          size="small"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <CircularProgress size={16} /> : t('uploaddialog.login')}
        </Button>
      }
    >
      {t('uploaddialog.login_hint')}
    </Alert>
  );
};

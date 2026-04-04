import React from 'react';
import { useRouter } from 'next/router';
import { Typography } from '@mui/material';
import { UserProfileTicksPanel } from '../../src/components/UserProfile/UserProfileTicksPanel';
import { PROJECT_ID } from '../../src/services/project';
import { PanelSidePadding } from '../../src/components/utils/PanelHelpers';
import { t } from '../../src/services/intl';

export default function UserProfilePage() {
  const router = useRouter();
  const { displayName } = router.query;

  if (PROJECT_ID !== 'openclimbing') {
    return (
      <PanelSidePadding>
        <Typography variant="body1">
          {t('user_profile.unavailable_project')}
        </Typography>
      </PanelSidePadding>
    );
  }

  if (!router.isReady || typeof displayName !== 'string') {
    return null;
  }

  return <UserProfileTicksPanel displayNameParam={displayName} />;
}

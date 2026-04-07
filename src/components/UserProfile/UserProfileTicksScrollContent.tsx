import React from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { PanelScrollbars, PanelSidePadding } from '../utils/PanelHelpers';
import { UserProfileHero } from './UserProfileHero';
import { UserProfilePerformanceSection } from './UserProfilePerformanceSection';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { UserProfileFetchState } from './useUserProfileFetch';

type Props = {
  titleName: string;
  own: boolean;
  state: UserProfileFetchState;
  showLoader: boolean;
  ticksPanelEnabled: boolean;
  isLoading: boolean;
  fetchedTicks: FetchedClimbingTick[];
  onClose: () => void;
};

function UserProfileFetchStateMessages({
  own,
  state,
}: {
  own: boolean;
  state: UserProfileFetchState;
}) {
  if (!own && state.kind === 'unknown') {
    return (
      <PanelSidePadding>
        <Alert severity="info" variant="outlined">
          {t('user_profile.unknown_user')}
        </Alert>
      </PanelSidePadding>
    );
  }
  if (!own && state.kind === 'error') {
    return (
      <PanelSidePadding>
        <Alert severity="error" variant="outlined">
          {t('user_profile.load_error')}
        </Alert>
      </PanelSidePadding>
    );
  }
  return null;
}

export const UserProfileTicksScrollContent = ({
  titleName,
  own,
  state,
  showLoader,
  ticksPanelEnabled,
  isLoading,
  fetchedTicks,
  onClose,
}: Props) => (
  <PanelScrollbars>
    <ClosePanelButton right onClick={onClose} />
    <UserProfileHero titleName={titleName} />

    {state.kind === 'ready' && !isLoading ? (
      <UserProfilePerformanceSection
        displayName={titleName}
        own={own}
        ticksPanelEnabled={ticksPanelEnabled}
        fetchedTicks={fetchedTicks}
      />
    ) : null}

    {showLoader ? (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
          py: 4,
        }}
      >
        <CircularProgress />
      </Box>
    ) : null}

    <UserProfileFetchStateMessages own={own} state={state} />
  </PanelScrollbars>
);

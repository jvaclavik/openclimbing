import React from 'react';
import { Alert, Box, CircularProgress, Divider } from '@mui/material';
import { t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelScrollbars,
  PanelSidePadding,
  PANEL_GAP,
} from '../utils/PanelHelpers';
import {
  MyTicksContent,
  MyTicksEmptyHint,
} from '../MyTicksPanel/MyTicksContent';
import { UserProfileHero } from './UserProfileHero';
import { UserProfilePerformanceSection } from './UserProfilePerformanceSection';
import { UserProfileGradeSystemBar } from './UserProfileGradeSystemBar';
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
    <UserProfileGradeSystemBar />

    {state.kind === 'ready' && !isLoading && fetchedTicks.length > 0 ? (
      <UserProfilePerformanceSection fetchedTicks={fetchedTicks} />
    ) : null}

    <Divider sx={{ mb: 2 }} />

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

    {!own && state.kind === 'unknown' ? (
      <PanelSidePadding>
        <Alert severity="info" variant="outlined">
          {t('user_profile.unknown_user')}
        </Alert>
      </PanelSidePadding>
    ) : null}

    {!own && state.kind === 'error' ? (
      <PanelSidePadding>
        <Alert severity="error" variant="outlined">
          {t('user_profile.load_error')}
        </Alert>
      </PanelSidePadding>
    ) : null}

    {ticksPanelEnabled && !isLoading ? (
      <Box sx={{ px: PANEL_GAP, pt: 0 }}>
        <MyTicksContent
          fetchedTicks={fetchedTicks}
          readOnly={!own}
          emptyTicksMessage={
            own ? (
              <MyTicksEmptyHint />
            ) : (
              <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                {t('user_profile.no_ticks')}
              </Alert>
            )
          }
        />
      </Box>
    ) : null}
  </PanelScrollbars>
);

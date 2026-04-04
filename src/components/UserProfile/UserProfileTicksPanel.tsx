import React from 'react';
import Router from 'next/router';
import { Alert, Box, CircularProgress, Divider } from '@mui/material';
import { t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
  PANEL_GAP,
} from '../utils/PanelHelpers';
import { ClientOnly } from '../helpers';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { useAddHeatmap } from '../MyTicksPanel/useAddHeatmap';
import { useMyTicksPanelData } from '../MyTicksPanel/useMyTicksPanelData';
import { MyTicksContent } from '../MyTicksPanel/MyTicksContent';
import { useUserProfileFetch } from './useUserProfileFetch';
import { UserProfileHero } from './UserProfileHero';

export const UserProfileTicksPanel = ({
  displayNameParam,
}: {
  displayNameParam: string;
}) => {
  const { userSettings } = useUserSettingsContext();
  const state = useUserProfileFetch(displayNameParam);

  const readyTicks = state.kind === 'ready' ? state.ticks : null;
  const ticksPanelEnabled = state.kind === 'ready';

  const { fetchedTicks, isLoading } = useMyTicksPanelData(
    readyTicks,
    userSettings['climbing.gradeSystem'],
    { enabled: ticksPanelEnabled },
  );

  useAddHeatmap(fetchedTicks);

  const handleClose = () => {
    Router.push(`/`);
  };

  const titleName =
    state.kind === 'ready' ? state.displayName : displayNameParam;

  return (
    <ClientOnly>
      <MobilePageDrawer className="my-ticks-drawer">
        <PanelContent>
          <PanelScrollbars>
            <ClosePanelButton right onClick={handleClose} />

            <UserProfileHero titleName={titleName} />

            <Divider sx={{ mb: 2 }} />

            {state.kind === 'loading' || (ticksPanelEnabled && isLoading) ? (
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

            {state.kind === 'unknown' ? (
              <PanelSidePadding>
                <Alert severity="info" variant="outlined">
                  {t('user_profile.unknown_user')}
                </Alert>
              </PanelSidePadding>
            ) : null}

            {state.kind === 'error' ? (
              <PanelSidePadding>
                <Alert severity="error" variant="outlined">
                  {t('user_profile.load_error')}
                </Alert>
              </PanelSidePadding>
            ) : null}

            {state.kind === 'ready' && !isLoading ? (
              <Box sx={{ px: PANEL_GAP, pt: 0 }}>
                <MyTicksContent
                  fetchedTicks={fetchedTicks}
                  readOnly
                  emptyTicksMessage={
                    <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                      {t('user_profile.no_ticks')}
                    </Alert>
                  }
                />
              </Box>
            ) : null}
          </PanelScrollbars>
        </PanelContent>
      </MobilePageDrawer>
    </ClientOnly>
  );
};

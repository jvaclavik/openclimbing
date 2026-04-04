import React from 'react';
import Router from 'next/router';
import { CircularProgress, Link, Stack, Typography } from '@mui/material';
import { t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { ClientOnly } from '../helpers';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { useAddHeatmap } from '../MyTicksPanel/useAddHeatmap';
import { useMyTicksPanelData } from '../MyTicksPanel/useMyTicksPanelData';
import { MyTicksContent } from '../MyTicksPanel/MyTicksContent';
import { useUserProfileFetch } from './useUserProfileFetch';

const OSM_USER_BASE = 'https://www.openstreetmap.org/user';

export const UserProfileTicksPanel = ({
  displayNameParam,
}: {
  displayNameParam: string;
}) => {
  const { userSettings } = useUserSettingsContext();
  const state = useUserProfileFetch(displayNameParam);

  const readyTicks = state.kind === 'ready' ? state.ticks : null;
  const overpassEnabled = state.kind === 'ready';

  const { fetchedTicks, features, isLoading } = useMyTicksPanelData(
    readyTicks,
    false,
    userSettings['climbing.gradeSystem'],
    { enabled: overpassEnabled },
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
            <PanelSidePadding>
              <Typography
                variant="h1"
                component="h1"
                sx={{ fontSize: '1.5rem' }}
              >
                {t('user_profile.title', { name: titleName })}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <Link
                  href={`${OSM_USER_BASE}/${encodeURIComponent(titleName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('user_profile.osm_profile_link')}
                </Link>
              </Typography>
            </PanelSidePadding>

            {state.kind === 'loading' || (overpassEnabled && isLoading) ? (
              <Stack justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Stack>
            ) : null}

            {state.kind === 'unknown' ? (
              <PanelSidePadding>
                <Typography variant="body1">
                  {t('user_profile.unknown_user')}
                </Typography>
              </PanelSidePadding>
            ) : null}

            {state.kind === 'error' ? (
              <PanelSidePadding>
                <Typography variant="body1" color="error">
                  {t('user_profile.load_error')}
                </Typography>
              </PanelSidePadding>
            ) : null}

            {state.kind === 'ready' && !isLoading ? (
              <MyTicksContent
                fetchedTicks={fetchedTicks}
                features={features}
                readOnly
                emptyTicksMessage={
                  <PanelSidePadding>
                    <Typography variant="body1">
                      {t('user_profile.no_ticks')}
                    </Typography>
                  </PanelSidePadding>
                }
              />
            ) : null}
          </PanelScrollbars>
        </PanelContent>
      </MobilePageDrawer>
    </ClientOnly>
  );
};

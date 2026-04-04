import React from 'react';
import Router from 'next/router';
import { CircularProgress, Stack } from '@mui/material';
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
import { useAddHeatmap } from './useAddHeatmap';
import { useTicksContext } from '../utils/TicksContext';
import { useMyTicksPanelData } from './useMyTicksPanelData';
import { MyTicksContent } from './MyTicksContent';

export const MyTicksPanel = () => {
  const { userSettings } = useUserSettingsContext();
  const { ticks } = useTicksContext();
  const { fetchedTicks, isLoading } = useMyTicksPanelData(
    ticks,
    userSettings['climbing.gradeSystem'],
  );

  const handleClose = () => {
    Router.push(`/`);
  };

  useAddHeatmap(fetchedTicks);

  return (
    <ClientOnly>
      <MobilePageDrawer className="my-ticks-drawer">
        <PanelContent>
          <PanelScrollbars>
            <ClosePanelButton right onClick={handleClose} />
            <PanelSidePadding>
              <h1>{t('my_ticks.title')}</h1>
            </PanelSidePadding>

            {isLoading ? (
              <Stack justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Stack>
            ) : (
              <MyTicksContent fetchedTicks={fetchedTicks} />
            )}
          </PanelScrollbars>
        </PanelContent>
      </MobilePageDrawer>
    </ClientOnly>
  );
};

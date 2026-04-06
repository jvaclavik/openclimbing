import React from 'react';
import Router from 'next/router';
import { PanelContent } from '../utils/PanelHelpers';
import { ClientOnly } from '../helpers';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { useAddHeatmap } from '../MyTicksPanel/useAddHeatmap';
import { useMyTicksPanelData } from '../MyTicksPanel/useMyTicksPanelData';
import { useUserProfileFetch } from './useUserProfileFetch';
import { useOsmAuthContext } from '../utils/OsmAuthContext';
import { useTicksContext } from '../utils/TicksContext';
import { UserProfileTicksScrollContent } from './UserProfileTicksScrollContent';

function tryDecodeDisplayName(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

function isOwnClimbingProfile(
  displayNameParam: string,
  osmUser: string | undefined,
): boolean {
  if (!osmUser) {
    return false;
  }
  return tryDecodeDisplayName(displayNameParam) === osmUser;
}

export const UserProfileTicksPanel = ({
  displayNameParam,
}: {
  displayNameParam: string;
}) => {
  const { gradeSystem } = useUserSettingsContext();
  const { loggedIn, osmUser } = useOsmAuthContext();
  const { ticks: contextTicks } = useTicksContext();

  const own = loggedIn && isOwnClimbingProfile(displayNameParam, osmUser);
  const state = useUserProfileFetch(displayNameParam, { skip: own });

  const readyTicks = own
    ? contextTicks
    : state.kind === 'ready'
      ? state.ticks
      : null;
  const ticksPanelEnabled = own
    ? contextTicks !== null
    : state.kind === 'ready';

  const { fetchedTicks, isLoading } = useMyTicksPanelData(
    readyTicks,
    gradeSystem,
    { enabled: ticksPanelEnabled },
  );

  useAddHeatmap(fetchedTicks);

  const handleClose = () => {
    Router.push(`/`);
  };

  const titleName =
    state.kind === 'ready' ? state.displayName : displayNameParam;

  const waitingForOwnTicks = own && contextTicks === null;
  const waitingForPublicProfile = !own && state.kind === 'loading';
  const showLoader =
    waitingForOwnTicks ||
    waitingForPublicProfile ||
    (ticksPanelEnabled && isLoading);

  return (
    <ClientOnly>
      <MobilePageDrawer className="my-ticks-drawer">
        <PanelContent>
          <UserProfileTicksScrollContent
            titleName={titleName}
            own={own}
            state={state}
            showLoader={showLoader}
            ticksPanelEnabled={ticksPanelEnabled}
            isLoading={isLoading}
            fetchedTicks={fetchedTicks}
            onClose={handleClose}
          />
        </PanelContent>
      </MobilePageDrawer>
    </ClientOnly>
  );
};

import React from 'react';
import styled from '@emotion/styled';
import { PanelLabel } from '../PanelLabel';
import { AddTickButton } from './AddTickButton';
import { DotLoader } from '../../../helpers';
import { useOsmAuthContext } from '../../../utils/OsmAuthContext';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { getShortId } from '../../../../services/helpers';
import { RouteTickRow } from '../RouteTickRow';
import { isFeatureClimbingRoute } from '../../../../utils';
import { useTicksContext } from '../../../utils/TicksContext';
import { PROJECT_ID } from '../../../../services/project';
import { t } from '../../../../services/intl';
import { TickSessionCard } from '../../../MyTicksPanel/TickSessionCard';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

const Container = styled.div`
  margin-bottom: 20px;
`;
const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 20px 10px;
`;

const NotLoggedIn = () => (
  <Row>
    <AddTickButton />
  </Row>
);

const ErrorLoadingTicks = () => {
  const { error } = useTicksContext();

  return (
    <Container>
      <PanelLabel>{t('route_ticks.title')}</PanelLabel>
      Error: {JSON.stringify(error)}
    </Container>
  );
};

const NoTicksFound = () => (
  <Row>
    <AddTickButton />
  </Row>
);

const MyRouteTicksInner = () => {
  const { feature } = useFeatureContext();
  const { ticks, error, isFetching } = useTicksContext();
  const { loggedIn } = useOsmAuthContext();
  const { gradeSystem } = useUserSettingsContext();

  if (!loggedIn) {
    return <NotLoggedIn />;
  }
  if (ticks === null) {
    return <DotLoader />;
  }
  const ticksForRoute = ticks
    .filter(({ shortId }) => shortId === getShortId(feature.osmMeta))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  if (isFetching && ticksForRoute.length === 0) {
    return <DotLoader />;
  }
  if (error) {
    return <ErrorLoadingTicks />;
  }
  if (ticksForRoute.length === 0) {
    return <NoTicksFound />;
  }

  return (
    <Container>
      <PanelLabel addition={<AddTickButton />}>
        {t('route_ticks.title')}
        <span>{isFetching && <DotLoader />}</span>
      </PanelLabel>

      <TickSessionCard columns={['name', 'style', 'points', 'more']}>
        {ticksForRoute.map((tick) => (
          <RouteTickRow
            key={tick.id}
            tick={tick}
            routeTags={feature.tags}
            gradeSystem={gradeSystem}
          />
        ))}
      </TickSessionCard>
    </Container>
  );
};

export const MyRouteTicks = () => {
  const { feature } = useFeatureContext();
  if (!isFeatureClimbingRoute(feature)) {
    return null;
  }

  if (PROJECT_ID !== 'openclimbing') {
    return null; // ticks are not loaded in context
  }

  return <MyRouteTicksInner />;
};

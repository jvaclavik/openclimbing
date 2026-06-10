import React from 'react';
import styled from '@emotion/styled';
import { Paper, Table, TableContainer } from '@mui/material';
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

  if (!loggedIn) {
    return <NotLoggedIn />;
  }
  if (ticks === null) {
    return <DotLoader />;
  }
  const ticksForRoute = ticks.filter(
    ({ shortId }) => shortId === getShortId(feature.osmMeta),
  );
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

      <TableContainer
        component={Paper}
        sx={{
          mx: -2,
          width: 'auto',
          overflowX: 'auto',
          borderRadius: 0,
        }}
      >
        <Table size="small">
          {ticksForRoute.map((tick) => {
            return <RouteTickRow key={tick.id} tick={tick} />;
          })}
        </Table>
      </TableContainer>
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

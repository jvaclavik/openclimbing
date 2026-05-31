import styled from '@emotion/styled';
import { Button, ButtonGroup, Typography } from '@mui/material';
import {
  CLIMBING_ROUTE_ROW_HEIGHT,
  DIALOG_TOP_BAR_HEIGHT,
  SPLIT_PANE_DEFAULT_SIZE,
} from './config';
import { ContentContainer } from './ContentContainer';
import { useClimbingContext } from './contexts/ClimbingContext';
import { RouteList } from './RouteList/RouteList';
import { invertedBoltCodeMap } from './utils/boltCodes';

import dynamic from 'next/dynamic';
import { t } from '../../../services/intl';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { EditButton } from '../EditButton';
import { EditDialog } from '../EditDialog/EditDialog';
import { PanelLabel } from './PanelLabel';
import { RouteDistribution } from './RouteDistribution';
import { useGetCragViewLayout } from './utils/useCragViewLayout';

const CragMapDynamic = dynamic(() => import('./CragMap'), {
  ssr: false,
  loading: () => <div />,
});

const ContentBelowRouteList = styled.div<{
  $splitPaneSize: number;
  $cragViewLayout: 'horizontal' | 'vertical';
}>`
  min-height: ${({ $cragViewLayout, $splitPaneSize }) =>
    $cragViewLayout === 'horizontal'
      ? `
  calc(
    100vh -
      ${$splitPaneSize ? `${$splitPaneSize}px` : SPLIT_PANE_DEFAULT_SIZE} -
      ${DIALOG_TOP_BAR_HEIGHT + CLIMBING_ROUTE_ROW_HEIGHT + 40}px
  );`
      : `calc(100vh - ${DIALOG_TOP_BAR_HEIGHT + CLIMBING_ROUTE_ROW_HEIGHT + 40}px);`};
`;

const HideOnNarrowPanel = styled.div`
  @container (max-width: 220px) {
    display: none;
  }
`;

export const ClimbingViewContent = ({ isMapVisible }) => {
  const { showDebugMenu, routes } = useClimbingContext();
  const { feature } = useFeatureContext();
  const cragViewLayout = useGetCragViewLayout();
  const { userSettings } = useUserSettingsContext();
  const splitPaneSize = userSettings['climbing.splitPaneSize'];

  const getRoutesCsv = () => {
    const getPathString = (path) =>
      path
        ?.map(
          ({ x, y, type }) =>
            `${x},${y}${type ? invertedBoltCodeMap[type] : ''}`,
        )
        .join('|');

    const object = routes
      .map((route, _idx) => {
        const photos = Object.entries(route.paths);

        return photos.map((photoName) => [
          route.feature.tags.name,
          `File:${photoName?.[0]}`,
          getPathString(photoName?.[1]),
        ]);
      })
      .flat();
    // eslint-disable-next-line no-console
    console.table(object);
  };

  return isMapVisible ? (
    <CragMapDynamic />
  ) : (
    <>
      <RouteList isEditable />
      <ContentBelowRouteList
        $splitPaneSize={splitPaneSize}
        $cragViewLayout={cragViewLayout}
      >
        <ContentContainer>
          {showDebugMenu && (
            <>
              <br />
              <ButtonGroup variant="contained" size="small" color="primary">
                <Button size="small" onClick={getRoutesCsv}>
                  export OSM
                </Button>
              </ButtonGroup>
            </>
          )}
        </ContentContainer>
        <HideOnNarrowPanel>
          <RouteDistribution features={feature.memberFeatures} />
        </HideOnNarrowPanel>

        {feature.tags.description ? (
          <HideOnNarrowPanel>
            <PanelLabel>{t('climbingview.description')}</PanelLabel>

            <Typography ml={2} mr={2}>
              {feature.tags.description}
            </Typography>
          </HideOnNarrowPanel>
        ) : null}

        <EditButton />
        <EditDialog />
      </ContentBelowRouteList>
    </>
  );
};

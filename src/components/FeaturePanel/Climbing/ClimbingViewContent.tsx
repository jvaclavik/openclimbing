import styled from '@emotion/styled';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CLIMBING_ROUTE_ROW_HEIGHT,
  DIALOG_TOP_BAR_HEIGHT,
  getSplitPaneDefaultSize,
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
import { FeaturedTags, getFeaturedTagKeys } from '../FeaturedTags';
import { PanelLabel } from './PanelLabel';
import { RouteDistribution } from './RouteDistribution';
import { useGetCragViewLayout } from './utils/useCragViewLayout';
import { getDescription } from '../../../helpers/featureLabel';
import { useReloadClimbingDialog } from './utils/useReloadClimbingDialog';

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
      ${$splitPaneSize ? `${$splitPaneSize}px` : getSplitPaneDefaultSize($cragViewLayout)} -
      ${DIALOG_TOP_BAR_HEIGHT + CLIMBING_ROUTE_ROW_HEIGHT + 40}px
  );`
      : `calc(100vh - ${DIALOG_TOP_BAR_HEIGHT + CLIMBING_ROUTE_ROW_HEIGHT + 40}px);`};
`;

const HideOnNarrowPanel = styled.div`
  @container (max-width: 220px) {
    display: none;
  }
`;

const ReloadFromOsmButton = () => {
  const { reload, isReloading } = useReloadClimbingDialog();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
      <Tooltip title={`${t('featurepanel.reload_fresh_data')} (Alt+R)`}>
        <span>
          <IconButton
            size="small"
            onClick={() => void reload()}
            disabled={isReloading}
            aria-label={t('featurepanel.reload_fresh_data')}
            sx={{ color: 'text.disabled' }}
          >
            {isReloading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export const ClimbingViewContent = ({ isMapVisible, setIsMapVisible }) => {
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
    <CragMapDynamic setIsMapVisible={setIsMapVisible} />
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

        <ContentContainer>
          {getDescription(feature) ? (
            <HideOnNarrowPanel>
              <PanelLabel>{t('climbingview.description')}</PanelLabel>

              <Typography
                sx={{
                  ml: 2,
                  mr: 2,
                }}
              >
                {getDescription(feature)}
              </Typography>
            </HideOnNarrowPanel>
          ) : null}

          {getFeaturedTagKeys(feature).length > 0 && (
            <HideOnNarrowPanel>
              <PanelLabel>{t('climbingview.links')}</PanelLabel>

              <Box
                sx={{
                  ml: 2,
                  mr: 2,
                }}
              >
                <FeaturedTags />
              </Box>
            </HideOnNarrowPanel>
          )}
        </ContentContainer>

        <EditButton />
        <EditDialog />
        <ReloadFromOsmButton />
      </ContentBelowRouteList>
    </>
  );
};

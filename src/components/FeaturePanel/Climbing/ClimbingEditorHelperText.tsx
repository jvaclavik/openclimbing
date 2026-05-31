import React from 'react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useClimbingContext } from './contexts/ClimbingContext';
import { useFeatureContext } from '../../utils/FeatureContext';
import { getWikimediaCommonsPhotoPathKeys } from './utils/photo';
import { RouteNumber } from './RouteNumber';
import { t } from '../../../services/intl';
import { useMobileMode } from '../../helpers';

const InlineBlockContainer = styled.div`
  display: inline-block;
`;

const InfoHintRoot = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.palette.info.main};
  font-size: 0.875rem;
  line-height: 1.43;
  padding: 4px 0;
`;

const InfoHintIcon = styled(InfoOutlinedIcon)`
  flex-shrink: 0;
  font-size: 22px;
`;

const InfoHintMessage = styled.div`
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const InfoHintAction = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

type InfoHintProps = {
  children: React.ReactNode;
  action?: React.ReactNode;
};

export const InfoHint = ({ children, action }: InfoHintProps) => (
  <InfoHintRoot>
    <InfoHintIcon />
    <InfoHintMessage>{children}</InfoHintMessage>
    {action && <InfoHintAction>{action}</InfoHintAction>}
  </InfoHintRoot>
);

export const ClimbingEditorHelperText = () => {
  const {
    routeSelectedIndex,
    getCurrentPath,
    machine,
    isPlacingProtectionPoints,
  } = useClimbingContext();
  const { feature } = useFeatureContext();

  const routePhotoPathsCount = getWikimediaCommonsPhotoPathKeys(
    feature.memberFeatures[routeSelectedIndex]?.tags ?? {},
  ).length;

  const onDrawRouteClick = () => {
    machine.execute('extendRoute', { routeNumber: routeSelectedIndex });
  };
  const path = getCurrentPath();
  const isInSchema = path.length > 0;
  const isMobileMode = useMobileMode();

  const DrawButton = () => (
    <Button
      color="info"
      variant="contained"
      size="small"
      onClick={onDrawRouteClick}
      endIcon={
        <RouteNumber hasCircle={true} hasTick={false} hasTooltip={false}>
          {routeSelectedIndex + 1}
        </RouteNumber>
      }
    >
      {t('climbingpanel.draw_route')}
    </Button>
  );

  return (
    <>
      {!isMobileMode && isPlacingProtectionPoints && (
        <InfoHint>{t('climbingpanel.protection_points_hint')}</InfoHint>
      )}

      {!isMobileMode && !isPlacingProtectionPoints && (
        <>
          {routeSelectedIndex === null && (
            <InfoHint>{t('climbingpanel.select_route_to_draw')}</InfoHint>
          )}

          {machine.currentStateName !== 'extendRoute' &&
            routeSelectedIndex !== null &&
            isInSchema &&
            routePhotoPathsCount > 0 && (
              <InfoHint>
                {t('climbingpanel.update_route_1')}{' '}
                <InlineBlockContainer>
                  <RouteNumber
                    hasCircle={true}
                    hasTick={false}
                    hasTooltip={false}
                  >
                    {routeSelectedIndex + 1}
                  </RouteNumber>
                </InlineBlockContainer>{' '}
                {t('climbingpanel.update_route_2')}
              </InfoHint>
            )}

          {machine.currentStateName === 'extendRoute' && !isInSchema && (
            <InfoHint>{t('climbingpanel.create_first_node')}</InfoHint>
          )}
          {machine.currentStateName === 'extendRoute' && isInSchema && (
            <InfoHint>{t('climbingpanel.create_next_node')}</InfoHint>
          )}
        </>
      )}

      {machine.currentStateName !== 'extendRoute' &&
        routeSelectedIndex !== null &&
        !isInSchema &&
        !isPlacingProtectionPoints && (
          <>
            {isMobileMode ? (
              <DrawButton />
            ) : (
              <InfoHint action={<DrawButton />}>
                {t('climbingpanel.route_not_drawn_yet')}
              </InfoHint>
            )}
          </>
        )}
    </>
  );
};

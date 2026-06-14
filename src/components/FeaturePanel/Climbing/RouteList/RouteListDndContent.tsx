import { useRef } from 'react';
import styled from '@emotion/styled';
import React from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { RenderListRow } from './RouteListRow';
import { GradeSystemSelect } from '../GradeSystemSelect';
import { t } from '../../../../services/intl';
import { Box } from '@mui/material';
import { useReplacePhotoIfNeeded } from '../utils/useReplacePhotoIfNeeded';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

const Container = styled.div`
  width: 100%;
  margin: 0 auto;
`;

const MaxWidthContainer = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const RowInner = styled.div<{
  isSelected: boolean;
  isHovered: boolean;
}>`
  cursor: pointer;
  display: flex;
  justify-content: center;
  -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
  background: ${({ isSelected, isHovered, theme }) =>
    isSelected
      ? theme.palette.action.selected
      : isHovered
        ? theme.palette.action.hover
        : 'transparent'};
  position: relative;
  font-size: 16px;
  border-top: dotted 1px ${({ theme }) => theme.palette.divider};
  z-index: ${({ isSelected }) => (isSelected ? '2' : 'auto')};
  transition: background-color 0.1s;
`;

const RowContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: center;
  font-weight: 700;
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 11px;
  padding-top: 12px;
  padding-bottom: 4px;

  @container (max-width: 220px) {
    display: none;
  }
`;
const NameHeader = styled.div`
  flex: 1;
  padding-left: 40px;
`;

export const RouteListDndContent = () => {
  const {
    routes,
    routeSelectedIndex,
    isRouteSelected,
    isEditMode,
    machine,
    routeIndexHovered,
    setRouteIndexHovered,
  } = useClimbingContext();
  const { userSettings } = useUserSettingsContext();
  const parentRef = useRef<HTMLDivElement>(null);
  const replacePhotoIfNeeded = useReplacePhotoIfNeeded();
  const onRowClick = (index: number) => {
    if (userSettings['climbing.showRelatedPhotoByRouteClick'] && !isEditMode) {
      replacePhotoIfNeeded({
        selectedIndex: index,
      });
    }
    const routeNumber = routeSelectedIndex === index ? null : index;
    if (isEditMode) {
      machine.execute('editRoute', { routeNumber });
    } else {
      machine.execute('routeSelect', { routeNumber });
    }
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <Container ref={parentRef}>
      <TableHeader>
        <MaxWidthContainer>
          <NameHeader>{t('member_features.climbing')}</NameHeader>
          <Box mr={1}>
            <GradeSystemSelect />
          </Box>
        </MaxWidthContainer>
      </TableHeader>
      {routes.map((route, index) => {
        const isSelected = isRouteSelected(index);
        return (
          <RowInner
            key={route.id ?? index}
            isSelected={isSelected}
            isHovered={routeIndexHovered === index}
            onMouseEnter={() => setRouteIndexHovered(index)}
            onMouseLeave={() => setRouteIndexHovered(null)}
            onClick={() => {
              onRowClick(index);
            }}
          >
            <MaxWidthContainer>
              <RowContent>
                <RenderListRow
                  key={route.id}
                  routeId={route.id}
                  stopPropagation={stopPropagation}
                  parentRef={parentRef}
                  feature={route.feature}
                />
              </RowContent>
            </MaxWidthContainer>
          </RowInner>
        );
      })}
    </Container>
  );
};

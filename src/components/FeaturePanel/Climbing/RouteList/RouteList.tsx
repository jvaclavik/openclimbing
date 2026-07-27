import { useEffect } from 'react';
import React from 'react';
import styled from '@emotion/styled';

import { useClimbingContext } from '../contexts/ClimbingContext';
import { RouteListDndContent } from './RouteListDndContent';
import { isTypingInFormField } from '../../../../helpers/hooks';

const Container = styled.div`
  padding-bottom: 20px;
  position: relative; // mobile safari fix
`;

export const RouteList = (_props: { isEditable?: boolean }) => {
  const {
    routes,
    routeSelectedIndex,
    routeIndexExpanded,
    machine,
    isEditMode,
  } = useClimbingContext();

  useEffect(() => {
    // Switching routes must go through the state machine (same as clicking a
    // row). Setting the index directly used to leave the machine in
    // 'extendRoute' when you navigated away mid-drawing, which hid the
    // "start route" button on the newly selected, not-yet-drawn route.
    const selectRoute = (routeNumber: number) => {
      if (isEditMode) {
        machine.execute('editRoute', { routeNumber });
      } else {
        machine.execute('routeSelect', { routeNumber });
      }
    };

    const downHandler = (e) => {
      if (routes.length === 0) return;
      if (isTypingInFormField(e.target)) return;

      if (e.key === 'ArrowDown') {
        const nextRoute = routes[routeSelectedIndex + 1];
        if (nextRoute) {
          selectRoute(routeSelectedIndex + 1);
          e.preventDefault();
        }
      }
      if (e.key === 'ArrowUp') {
        const prevRoute = routes[routeSelectedIndex - 1];
        if (prevRoute) {
          selectRoute(routeSelectedIndex - 1);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', downHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [routeSelectedIndex, routes, routeIndexExpanded, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Container>{routes.length !== 0 && <RouteListDndContent />}</Container>
  );
};

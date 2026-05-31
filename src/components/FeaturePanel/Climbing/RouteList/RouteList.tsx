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
    setRouteSelectedIndex,
    routeSelectedIndex,
    routeIndexExpanded,
  } = useClimbingContext();

  useEffect(() => {
    const downHandler = (e) => {
      if (routes.length === 0) return;
      if (isTypingInFormField(e.target)) return;

      if (e.key === 'ArrowDown') {
        const nextRoute = routes[routeSelectedIndex + 1];
        if (nextRoute) {
          setRouteSelectedIndex(routeSelectedIndex + 1);
          e.preventDefault();
        }
      }
      if (e.key === 'ArrowUp') {
        const prevRoute = routes[routeSelectedIndex - 1];
        if (prevRoute) {
          setRouteSelectedIndex(routeSelectedIndex - 1);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', downHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [routeSelectedIndex, routes, routeIndexExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Container>{routes.length !== 0 && <RouteListDndContent />}</Container>
  );
};

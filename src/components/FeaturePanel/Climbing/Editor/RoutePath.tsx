import React from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { PathWithBorder } from './PathWithBorder';

type Props = {
  routeIndex: number;
};

export const RoutePath = ({ routeIndex }: Props) => {
  const { getPathForRoute, routes } = useClimbingContext();
  const route = routes[routeIndex];
  const path = getPathForRoute(route);

  if (!path) {
    return null;
  }

  return <PathWithBorder routeIndex={routeIndex} path={path} />;
};

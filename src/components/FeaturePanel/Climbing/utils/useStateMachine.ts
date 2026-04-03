import React, { useState } from 'react';
import { getEmptyRoute } from './getEmptyRoute';
import { getPositionInImageFromMouse } from './mousePositionUtils';
import { useSnackbar } from '../../../utils/SnackbarContext';

export type State =
  | 'editRoute'
  | 'extendRoute'
  | 'init'
  | 'pointMenu'
  | 'protectionPointMenu'
  | 'routeSelected';

export type StateAction =
  | 'addPointInBetween'
  | 'addPointToEnd'
  | 'cancelPointMenu'
  | 'cancelRouteSelection'
  | 'changePointType'
  | 'changeLineType'
  | 'createRoute'
  | 'deletePoint'
  | 'deleteRoute'
  | 'dragPoint'
  | 'editRoute'
  | 'extendRoute'
  | 'finishRoute'
  | 'routeSelect'
  | 'showPointMenu'
  | 'showProtectionPointMenu'
  | 'undoPoint';

export type ActionWithCallback = {
  nextState: State;
  callback?: (props: unknown) => void;
};
export type Machine = {
  [key in State]: Partial<Record<StateAction, ActionWithCallback>>;
};

export const useStateMachine = ({
  setRouteSelectedIndex,
  setPointSelectedIndex,
  updatePathOnRouteIndex,
  updateElementOnIndex,
  routeSelectedIndex,
  pointSelectedIndex,
  setRouteIndexHovered,
  setMousePosition,
  setRoutes,
  routes,
  updateRouteOnIndex,
  getPercentagePosition,
  findCloserPoint,
  svgRef,
  photoZoom,
  photoPath,
  setIsPanningDisabled,
  protectionPointSelectedIndex,
  setProtectionPointSelectedIndex,
  setProtectionPointTypeAtIndex,
  removeProtectionPointAtIndex,
  setIsPlacingProtectionPoints,
}) => {
  const [currentState, setCurrentState] = useState<State>('init');
  const { showToast } = useSnackbar();

  const routeSelect = ({ routeNumber }) => {
    setRouteSelectedIndex(routeNumber);
    setPointSelectedIndex(null);
    setProtectionPointSelectedIndex(null);
  };

  const cancelRouteSelection = () => {
    setRouteSelectedIndex(null);
    setPointSelectedIndex(null);
    setProtectionPointSelectedIndex(null);
    setIsPlacingProtectionPoints(false);
  };

  const deletePoint = () => {
    updatePathOnRouteIndex(routeSelectedIndex, (path) =>
      updateElementOnIndex(path, pointSelectedIndex),
    );
    setPointSelectedIndex(null);
  };
  const cancelPointMenu = () => {
    setPointSelectedIndex(null);
  };

  const editRoute = ({ routeNumber }) => {
    setRouteSelectedIndex(routeNumber);
    setPointSelectedIndex(null);
    setProtectionPointSelectedIndex(null);
  };

  const extendRoute = (props: { routeNumber?: number }) => {
    if (props?.routeNumber) {
      setRouteSelectedIndex(props.routeNumber);
      setPointSelectedIndex(null);
    }
    setRouteIndexHovered(null);
    setIsPlacingProtectionPoints(false);
  };

  const finishRoute = () => {
    setMousePosition(null);
    setIsPanningDisabled(false);
  };

  const createRoute = () => {
    const newIndex = routes.length;
    setRouteSelectedIndex(newIndex);
    setPointSelectedIndex(null);
    setProtectionPointSelectedIndex(null);
    setRoutes([...routes, getEmptyRoute()]);
  };

  const deleteRoute = ({ routeNumber }: { routeNumber?: number }) => {
    updateRouteOnIndex(routeNumber || routeSelectedIndex);
    setRouteSelectedIndex(null);
    setPointSelectedIndex(null);
    setProtectionPointSelectedIndex(null);
  };

  const undoPoint = () => {
    updatePathOnRouteIndex(routeSelectedIndex, (path) => path.slice(0, -1));
  };

  const showPointMenu = () => {
    setIsPanningDisabled(false);
  };

  const showProtectionPointMenu = () => {
    setIsPanningDisabled(false);
  };

  const dragPoint = () => {};

  const changePointType = ({ type }) => {
    updatePathOnRouteIndex(routeSelectedIndex, (path) =>
      updateElementOnIndex(path, pointSelectedIndex, (point) => {
        const next = { ...point };
        if (type == null) {
          delete next.type;
        } else {
          next.type = type;
        }
        return next;
      }),
    );
  };

  const changeProtectionPointType = ({ type }) => {
    if (protectionPointSelectedIndex === null) {
      return;
    }
    setProtectionPointTypeAtIndex(protectionPointSelectedIndex, type);
  };

  const changeLineType = ({ previousLineType }) => {
    updatePathOnRouteIndex(routeSelectedIndex, (path) =>
      updateElementOnIndex(path, pointSelectedIndex, (point) => ({
        ...point,
        previousLineType,
      })),
    );
  };

  const deleteProtectionPoint = () => {
    if (protectionPointSelectedIndex === null) {
      return;
    }
    removeProtectionPointAtIndex(protectionPointSelectedIndex);
  };

  const cancelProtectionPointMenu = () => {
    setProtectionPointSelectedIndex(null);
  };

  const isMaximumNumberOfPoints = () => {
    const currentLength = routes[routeSelectedIndex].paths?.[photoPath]?.length;
    if (currentLength >= 19) {
      showToast('Maximum number of points in a route is 19.');
      return true;
    }
  };

  const addPointInBetween = ({
    hoveredPosition,
    hoveredSegmentIndex,
    disableSnap,
  }) => {
    if (isMaximumNumberOfPoints()) return;

    const position = getPercentagePosition(hoveredPosition);
    const closestPoint = findCloserPoint(position, { disableSnap });
    const inserted = closestPoint ? { ...closestPoint } : position;
    updatePathOnRouteIndex(routeSelectedIndex, (path) => [
      ...path.slice(0, hoveredSegmentIndex + 1),
      inserted,
      ...path.slice(hoveredSegmentIndex + 1),
    ]);
  };

  const addPointToEnd = (event: React.MouseEvent) => {
    if (isMaximumNumberOfPoints()) return;

    const positionInImage = getPositionInImageFromMouse(
      svgRef,
      event,
      photoZoom,
    );

    const newCoordinate = getPercentagePosition(positionInImage);
    const closestPoint = findCloserPoint(newCoordinate, {
      disableSnap: event.altKey,
    });
    const nextPoint = closestPoint ? { ...closestPoint } : newCoordinate;
    updatePathOnRouteIndex(routeSelectedIndex, (path) => [...path, nextPoint]);
  };

  const noopLineOnProtection = () => {};

  const commonActions: Partial<Record<StateAction, ActionWithCallback>> = {
    createRoute: { nextState: 'editRoute', callback: createRoute },
    editRoute: { nextState: 'editRoute', callback: editRoute },
  };

  const states: Machine = {
    init: {
      ...commonActions,
      extendRoute: { nextState: 'extendRoute', callback: extendRoute },
      routeSelect: { nextState: 'routeSelected', callback: routeSelect },
      showProtectionPointMenu: {
        nextState: 'protectionPointMenu',
        callback: showProtectionPointMenu,
      },
    },
    editRoute: {
      ...commonActions,
      deleteRoute: { nextState: 'init', callback: deleteRoute },
      dragPoint: { nextState: 'editRoute', callback: dragPoint },
      cancelRouteSelection: {
        nextState: 'init',
        callback: cancelRouteSelection,
      },
      addPointInBetween: {
        nextState: 'editRoute',
        callback: addPointInBetween,
      },
      showPointMenu: { nextState: 'pointMenu', callback: showPointMenu },
      showProtectionPointMenu: {
        nextState: 'protectionPointMenu',
        callback: showProtectionPointMenu,
      },
      finishRoute: { nextState: 'editRoute', callback: finishRoute },
      extendRoute: { nextState: 'extendRoute', callback: extendRoute },
      routeSelect: { nextState: 'routeSelected', callback: routeSelect },
    },
    extendRoute: {
      ...commonActions,
      deleteRoute: { nextState: 'init', callback: deleteRoute },
      finishRoute: { nextState: 'editRoute', callback: finishRoute },
      undoPoint: { nextState: 'extendRoute', callback: undoPoint },
      showPointMenu: { nextState: 'pointMenu', callback: showPointMenu },
      dragPoint: { nextState: 'extendRoute', callback: dragPoint },
      addPointInBetween: {
        nextState: 'extendRoute',
        callback: addPointInBetween,
      },
      addPointToEnd: {
        nextState: 'extendRoute',
        callback: addPointToEnd,
      },
    },
    pointMenu: {
      ...commonActions,
      changePointType: { nextState: 'editRoute', callback: changePointType },
      changeLineType: { nextState: 'editRoute', callback: changeLineType },
      deletePoint: { nextState: 'editRoute', callback: deletePoint },
      cancelPointMenu: { nextState: 'editRoute', callback: cancelPointMenu },
      finishRoute: { nextState: 'editRoute', callback: finishRoute },
      extendRoute: { nextState: 'extendRoute', callback: extendRoute },
      dragPoint: { nextState: 'editRoute', callback: dragPoint },
    },
    protectionPointMenu: {
      ...commonActions,
      changePointType: {
        nextState: 'editRoute',
        callback: changeProtectionPointType,
      },
      changeLineType: {
        nextState: 'protectionPointMenu',
        callback: noopLineOnProtection,
      },
      deletePoint: { nextState: 'editRoute', callback: deleteProtectionPoint },
      cancelPointMenu: {
        nextState: 'editRoute',
        callback: cancelProtectionPointMenu,
      },
      finishRoute: { nextState: 'editRoute', callback: finishRoute },
      extendRoute: { nextState: 'extendRoute', callback: extendRoute },
      dragPoint: { nextState: 'protectionPointMenu', callback: dragPoint },
      showProtectionPointMenu: {
        nextState: 'protectionPointMenu',
        callback: showProtectionPointMenu,
      },
    },
    routeSelected: {
      ...commonActions,
      routeSelect: { nextState: 'routeSelected', callback: routeSelect },
      cancelRouteSelection: {
        nextState: 'init',
        callback: cancelRouteSelection,
      },
      extendRoute: { nextState: 'extendRoute', callback: extendRoute },
      showProtectionPointMenu: {
        nextState: 'protectionPointMenu',
        callback: showProtectionPointMenu,
      },
    },
  };

  return {
    currentState: states[currentState],
    currentStateName: currentState,
    execute: (desiredAction: StateAction, props?: unknown) => {
      if (desiredAction in states[currentState]) {
        const { nextState, callback } = states[currentState][desiredAction];
        setCurrentState(nextState);
        if (callback) callback(props);
      }
    },
  };
};

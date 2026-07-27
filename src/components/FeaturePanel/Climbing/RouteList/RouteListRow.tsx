/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef } from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { Feature } from '../../../../services/types';
import { ClimbingRouteTableRow } from './ClimbingRouteTableRow';

type Props = {
  routeId: string;
  stopPropagation: (e: React.MouseEvent) => void;
  parentRef: React.RefObject<HTMLDivElement>;
  feature: Feature;
};

export const RenderListRow = ({ routeId, parentRef, feature }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const { userSettings } = useUserSettingsContext();

  const {
    routes,
    routeSelectedIndex,
    routeIndexExpanded,
    setRouteIndexExpanded,
    setRouteListTopOffset,
    setRouteSelectedIndex,
    isEditMode,
  } = useClimbingContext();

  const index = routes.findIndex((route) => route.id === routeId);

  useEffect(() => {
    if (
      userSettings['climbing.selectRoutesByScrolling'] &&
      ref.current &&
      parentRef.current
    ) {
      const elementRect = ref.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();
      const relativeTop = elementRect.top - parentRect.top;

      setRouteListTopOffset(index, relativeTop);
    }
  }, [
    index,
    parentRef,
    setRouteListTopOffset,
    routeIndexExpanded,
    userSettings,
  ]);
  const isSelected = routeSelectedIndex === index;

  useEffect(() => {
    // Only the selected row should scroll itself into view. The previous code
    // OR-ed `isEditMode` outside the `isSelected` check, so in edit mode every
    // row ran scrollIntoView and the last one (not the selected one) won,
    // leaving the selected route scrolled out of sight.
    const shouldScrollIntoView =
      isSelected &&
      (isEditMode || !userSettings['climbing.selectRoutesByScrolling']);
    if (shouldScrollIntoView) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isEditMode, isSelected, userSettings]);

  const handleClick = () => {
    setRouteIndexExpanded(routeIndexExpanded === index ? null : index);
  };

  const handleDeselectRoute = (e) => {
    setRouteSelectedIndex(null);
    e.preventDefault();
  };

  return (
    <ClimbingRouteTableRow
      feature={feature}
      index={index}
      onClick={handleClick}
      ref={ref}
      isSelected={isSelected}
      isHrefLinkVisible={false}
    />
  );
};

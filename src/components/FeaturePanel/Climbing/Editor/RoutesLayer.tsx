import React from 'react';
import styled from '@emotion/styled';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { ProtectionPointsLayer } from './ProtectionPointsLayer';
import { RoutesLayerSvgContent } from './RoutesLayerSvgContent';
import { useRoutesLayerSvgHandlers } from './useRoutesLayerSvgHandlers';

const Svg = styled.svg<{
  $hasEditableCursor: boolean;
  $imageSize: { width: number; height: number };
  $isVisible: boolean;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transition: ${({ $isVisible }) =>
    $isVisible ? 'opacity 0.1s ease' : 'none'};
  transform-origin: 0 0;

  ${({ $hasEditableCursor }) =>
    $hasEditableCursor ? `cursor: crosshair;` : ''};
  ${({ $imageSize: { width, height } }) =>
    `width: ${width}px;
    height:${height}px;
    /*height: 100%;*/
    > * {
      -webkit-tap-highlight-color: transparent
    }
    `}
`;

type Props = {
  isVisible: boolean;
};

export const RoutesLayer = ({ isVisible }: Props) => {
  const {
    imageSize,
    machine,
    svgRef,
    isEditMode,
    isPlacingProtectionPoints,
    getCurrentPath,
  } = useClimbingContext();
  const { onClick, onPointerMove, handleOnMovingPointDropped } =
    useRoutesLayerSvgHandlers();
  const path = getCurrentPath();
  if (!path) return null;

  return (
    <Svg
      $hasEditableCursor={
        isEditMode &&
        (machine.currentStateName === 'extendRoute' ||
          isPlacingProtectionPoints)
      }
      onClick={onClick}
      onMouseUp={handleOnMovingPointDropped}
      onPointerMove={onPointerMove}
      $imageSize={imageSize}
      $isVisible={isVisible}
      xmlns="http://www.w3.org/2000/svg"
      ref={svgRef}
    >
      <ProtectionPointsLayer />
      <RoutesLayerSvgContent />
    </Svg>
  );
};

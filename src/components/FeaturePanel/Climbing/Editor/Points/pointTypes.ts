import type { MouseEvent } from 'react';

export type PointProps = {
  x: number;
  y: number;
  isPointSelected: boolean;
  onClick?: (e: any) => void;
  /** When set, used instead of the route point menu handler (e.g. protection anchors). */
  onMarkClick?: (e: MouseEvent) => void;
  pointerEvents?: string;
  pointIndex: number;
};

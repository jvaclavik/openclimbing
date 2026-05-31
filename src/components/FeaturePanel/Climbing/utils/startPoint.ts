import { ClimbingRoute, Position } from '../types';

export const getShiftForStartPoint = ({
  currentPosition: { x, y },
  currentRouteSelectedIndex,
  checkedRoutes,
  photoPath,
  maxRowsPerColumn,
  rowShift,
  columnShift,
}: {
  currentPosition: Position;
  checkedRoutes: Array<ClimbingRoute>;
  currentRouteSelectedIndex: number;
  photoPath: string;
  maxRowsPerColumn: number;
  rowShift: number;
  columnShift: number;
}) => {
  const stackIndex = checkedRoutes.reduce((count, route, index) => {
    const firstPoint: Position = route?.paths?.[photoPath]?.[0] ?? null;
    if (
      firstPoint &&
      x === firstPoint.x &&
      y === firstPoint.y &&
      index < currentRouteSelectedIndex
    ) {
      return count + 1;
    }
    return count;
  }, 0);

  const rowsPerColumn = Math.max(1, maxRowsPerColumn);
  return {
    x: Math.floor(stackIndex / rowsPerColumn) * columnShift,
    y: (stackIndex % rowsPerColumn) * rowShift,
  };
};
